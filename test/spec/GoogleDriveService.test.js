import { GoogleDriveService } from '../../src/GoogleDriveService.js';

// Mock global fetch
global.fetch = jest.fn();

describe('GoogleDriveService', () => {
    let service;

    beforeEach(() => {
        service = new GoogleDriveService();
        jest.clearAllMocks();
        chrome.runtime.lastError = null;
        chrome.identity.getAuthToken.mockImplementation((options, callback) => callback('mock-token-123'));
        chrome.identity.removeCachedAuthToken.mockImplementation((details, callback) => callback());
    });

    describe('authenticate', () => {
        it('should get auth token interactively', async () => {
            const token = await service.authenticate();

            expect(token).toBe('mock-token-123');
            expect(chrome.identity.getAuthToken).toHaveBeenCalledWith(
                { interactive: true },
                expect.any(Function)
            );
            expect(service.isAuthenticated()).toBe(true);
        });

        it('should reject when authentication fails', async () => {
            chrome.identity.getAuthToken.mockImplementation((options, callback) => {
                chrome.runtime.lastError = { message: 'User denied access' };
                callback(undefined);
                chrome.runtime.lastError = null;
            });

            await expect(service.authenticate()).rejects.toThrow('User denied access');
            expect(service.isAuthenticated()).toBe(false);
        });
    });

    describe('disconnect', () => {
        it('should revoke token and clear state', async () => {
            await service.authenticate();
            fetch.mockResolvedValueOnce({ ok: true });

            await service.disconnect();

            expect(chrome.identity.removeCachedAuthToken).toHaveBeenCalledWith(
                { token: 'mock-token-123' },
                expect.any(Function)
            );
            expect(service.isAuthenticated()).toBe(false);
        });

        it('should do nothing when not authenticated', async () => {
            await service.disconnect();
            expect(chrome.identity.removeCachedAuthToken).not.toHaveBeenCalled();
        });
    });

    describe('getToken', () => {
        it('should return cached token if available', async () => {
            await service.authenticate();
            jest.clearAllMocks();

            const token = await service.getToken();
            expect(token).toBe('mock-token-123');
            expect(chrome.identity.getAuthToken).not.toHaveBeenCalled();
        });

        it('should get token silently when not cached', async () => {
            const token = await service.getToken();
            expect(token).toBe('mock-token-123');
            expect(chrome.identity.getAuthToken).toHaveBeenCalledWith(
                { interactive: false },
                expect.any(Function)
            );
        });

        it('should reject when silent auth fails', async () => {
            chrome.identity.getAuthToken.mockImplementation((options, callback) => {
                chrome.runtime.lastError = { message: 'Not signed in' };
                callback(undefined);
                chrome.runtime.lastError = null;
            });

            await expect(service.getToken()).rejects.toThrow('Not authenticated');
        });
    });

    describe('isAuthenticated', () => {
        it('should return false initially', () => {
            expect(service.isAuthenticated()).toBe(false);
        });

        it('should return true after authentication', async () => {
            await service.authenticate();
            expect(service.isAuthenticated()).toBe(true);
        });
    });

    describe('findOrCreateFolder', () => {
        beforeEach(async () => {
            await service.authenticate();
        });

        it('should return cached folder ID if available', async () => {
            // First call - search returns existing folder
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ files: [{ id: 'folder-123', name: 'Exploratory Testing Sessions' }] })
            });

            const folderId1 = await service.findOrCreateFolder();
            expect(folderId1).toBe('folder-123');

            // Second call should use cache
            jest.clearAllMocks();
            const folderId2 = await service.findOrCreateFolder();
            expect(folderId2).toBe('folder-123');
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should find existing folder', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ files: [{ id: 'folder-123', name: 'Exploratory Testing Sessions' }] })
            });

            const folderId = await service.findOrCreateFolder();
            expect(folderId).toBe('folder-123');
        });

        it('should create folder when not found', async () => {
            // Search returns empty
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ files: [] })
            });

            // Create returns new folder
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ id: 'new-folder-456' })
            });

            const folderId = await service.findOrCreateFolder();
            expect(folderId).toBe('new-folder-456');
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('uploadSession', () => {
        beforeEach(async () => {
            await service.authenticate();
            // Mock findOrCreateFolder
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ files: [{ id: 'folder-123' }] })
            });
        });

        it('should create new file when no existing ID', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ id: 'file-789', name: 'test.json', modifiedTime: '2026-01-01T00:00:00Z' })
            });

            const result = await service.uploadSession('{"test":"data"}', 'test.json');
            expect(result.id).toBe('file-789');

            // Check that the POST was to the upload endpoint (not PATCH)
            const uploadCall = fetch.mock.calls[1];
            expect(uploadCall[0]).toContain('uploadType=multipart');
            expect(uploadCall[1].method).toBe('POST');
        });

        it('should update existing file when ID provided', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ id: 'file-789', name: 'test.json', modifiedTime: '2026-01-01T00:00:00Z' })
            });

            const result = await service.uploadSession('{"test":"data"}', 'test.json', 'file-789');
            expect(result.id).toBe('file-789');

            const uploadCall = fetch.mock.calls[1];
            expect(uploadCall[0]).toContain('file-789');
            expect(uploadCall[1].method).toBe('PATCH');
        });

        it('should throw on upload failure', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: () => Promise.resolve('Server error')
            });

            await expect(service.uploadSession('{"test":"data"}', 'test.json')).rejects.toThrow('Upload failed');
        });
    });

    describe('listSessions', () => {
        beforeEach(async () => {
            await service.authenticate();
        });

        it('should return list of session files', async () => {
            // findOrCreateFolder
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ files: [{ id: 'folder-123' }] })
            });

            // listSessions
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    files: [
                        { id: 'f1', name: 'Session1.json', modifiedTime: '2026-01-01T00:00:00Z', size: '1024' },
                        { id: 'f2', name: 'Session2.json', modifiedTime: '2026-01-02T00:00:00Z', size: '2048' }
                    ]
                })
            });

            const files = await service.listSessions();
            expect(files).toHaveLength(2);
            expect(files[0].id).toBe('f1');
        });

        it('should return empty array when no files', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ files: [{ id: 'folder-123' }] })
            });

            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ files: [] })
            });

            const files = await service.listSessions();
            expect(files).toHaveLength(0);
        });
    });

    describe('downloadSession', () => {
        beforeEach(async () => {
            await service.authenticate();
        });

        it('should download file content as text', async () => {
            const sessionData = '{"StartDateTime":123,"annotations":[]}';
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(sessionData)
            });

            const result = await service.downloadSession('file-123');
            expect(result).toBe(sessionData);
        });

        it('should throw on download failure', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            await expect(service.downloadSession('file-123')).rejects.toThrow('Download failed: 404');
        });
    });

    describe('deleteSession', () => {
        beforeEach(async () => {
            await service.authenticate();
        });

        it('should delete file successfully', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 204
            });

            await expect(service.deleteSession('file-123')).resolves.not.toThrow();
        });

        it('should throw on delete failure', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(service.deleteSession('file-123')).rejects.toThrow('Delete failed: 500');
        });
    });

    describe('fetchApi - token refresh on 401', () => {
        it('should retry with new token on 401', async () => {
            await service.authenticate();

            // First call returns 401
            fetch.mockResolvedValueOnce({ status: 401 });

            // After token refresh, retry succeeds
            chrome.identity.getAuthToken.mockImplementation((options, callback) => callback('new-token-456'));
            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ files: [] })
            });

            const response = await service.fetchApi('https://www.googleapis.com/drive/v3/files');
            expect(response.status).toBe(200);
            expect(chrome.identity.removeCachedAuthToken).toHaveBeenCalled();
        });
    });
});
