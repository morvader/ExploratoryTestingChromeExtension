const DRIVE_FOLDER_NAME = 'Exploratory Testing Sessions';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

export class GoogleDriveService {
    constructor() {
        this.token = null;
        this.folderId = null;
    }

    async authenticate() {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                this.token = token;
                resolve(token);
            });
        });
    }

    async disconnect() {
        if (!this.token) return;

        // Revoke the token on Google's side
        try {
            await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${this.token}`);
        } catch (e) {
            // Best effort revocation
        }

        return new Promise((resolve) => {
            chrome.identity.removeCachedAuthToken({ token: this.token }, () => {
                this.token = null;
                this.folderId = null;
                resolve();
            });
        });
    }

    async getToken() {
        if (this.token) return this.token;
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                if (chrome.runtime.lastError || !token) {
                    reject(new Error('Not authenticated'));
                    return;
                }
                this.token = token;
                resolve(token);
            });
        });
    }

    isAuthenticated() {
        return this.token !== null;
    }

    async fetchApi(url, options = {}) {
        const token = await this.getToken();
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (response.status === 401) {
            // Token expired, remove cached token and get a new one
            await new Promise(resolve => {
                chrome.identity.removeCachedAuthToken({ token: this.token }, resolve);
            });
            this.token = null;
            const newToken = await this.getToken();
            return fetch(url, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${newToken}`,
                    ...options.headers,
                },
            });
        }

        return response;
    }

    async findOrCreateFolder() {
        if (this.folderId) return this.folderId;

        // Search for existing folder
        const query = `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const searchUrl = `${DRIVE_API}?q=${encodeURIComponent(query)}&fields=files(id,name)`;

        const response = await this.fetchApi(searchUrl);
        const data = await response.json();

        if (data.files && data.files.length > 0) {
            this.folderId = data.files[0].id;
            return this.folderId;
        }

        // Create folder
        const createResponse = await this.fetchApi(DRIVE_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: DRIVE_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
            }),
        });

        const folder = await createResponse.json();
        this.folderId = folder.id;
        return this.folderId;
    }

    async uploadSession(sessionJson, fileName, existingFileId = null) {
        const folderId = await this.findOrCreateFolder();

        const metadata = {
            name: fileName,
            mimeType: 'application/json',
        };

        if (!existingFileId) {
            metadata.parents = [folderId];
        }

        const boundary = 'exploratory_testing_boundary';
        const body =
            `--${boundary}\r\n` +
            `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
            `${JSON.stringify(metadata)}\r\n` +
            `--${boundary}\r\n` +
            `Content-Type: application/json\r\n\r\n` +
            `${sessionJson}\r\n` +
            `--${boundary}--`;

        let url, method;
        if (existingFileId) {
            url = `${DRIVE_UPLOAD_API}/${existingFileId}?uploadType=multipart&fields=id,name,modifiedTime`;
            method = 'PATCH';
        } else {
            url = `${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id,name,modifiedTime`;
            method = 'POST';
        }

        const response = await this.fetchApi(url, {
            method,
            headers: {
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${error}`);
        }

        return response.json();
    }

    async listSessions() {
        const folderId = await this.findOrCreateFolder();
        const query = `'${folderId}' in parents and mimeType='application/json' and trashed=false`;
        const url = `${DRIVE_API}?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=20`;

        const response = await this.fetchApi(url);
        const data = await response.json();
        return data.files || [];
    }

    async downloadSession(fileId) {
        const url = `${DRIVE_API}/${fileId}?alt=media`;
        const response = await this.fetchApi(url);

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }

        return response.text();
    }

    async deleteSession(fileId) {
        const url = `${DRIVE_API}/${fileId}`;
        const response = await this.fetchApi(url, { method: 'DELETE' });

        if (!response.ok && response.status !== 204) {
            throw new Error(`Delete failed: ${response.status}`);
        }
    }
}
