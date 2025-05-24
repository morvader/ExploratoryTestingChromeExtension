export class ExportSessionCSV {
    constructor(session) {
        this.session = session;
    }

    getCSVData() {
        let csvData = "TimeStamp,Type,Name,URL\n";
        const annotations = this.session.getAnnotations();

        for (let i = 0; i < annotations.length; i++) {
            const annotation = annotations[i];
            const dateObj = annotation.getTimeStamp();

            const padTo2Digits = (num) => num.toString().padStart(2, '0');

            const day = padTo2Digits(dateObj.getDate());
            const month = padTo2Digits(dateObj.getMonth() + 1); // Months are 0-indexed
            const year = dateObj.getFullYear();
            const hours = padTo2Digits(dateObj.getHours());
            const minutes = padTo2Digits(dateObj.getMinutes());

            const timeStamp = `${day}-${month}-${year} ${hours}:${minutes}`;
            const type = annotation.getType();
            const name = annotation.getName();
            const url = annotation.getURL();

            csvData += `${timeStamp},${type},${name},${url}\n`;
        }

        return csvData;
    }

    downloadCSVFile() {
        var pom = document.createElement('a');
        var csvContent = this.getCSVData(); //here we load our csv data
        var blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;'
        });
        var url = URL.createObjectURL(blob);
        pom.href = url;
        pom.setAttribute('download', 'foo.csv');
        pom.click();
    }
}