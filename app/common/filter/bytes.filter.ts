export default function() {
    return function(bytes: string|number, precision: number) {
        if (isNaN(parseFloat(<string>bytes)) || !isFinite(<number>bytes))
            return '-';
        if (bytes === 0)
            return '';
        if (typeof precision === 'undefined')
            precision = 1;
        var units = [ 'bytes', 'kB', 'MB', 'GB', 'TB', 'PB' ], number = Math
            .floor(Math.log(<number>bytes) / Math.log(1024));
        return (<number>bytes / Math.pow(1024, Math.floor(number))).toFixed(precision)
            + ' ' + units[number];
    };
};