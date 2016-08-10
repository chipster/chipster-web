
export default function() {
    return function(seconds: number|string) {
        if (isNaN(parseFloat(<string>seconds)) || !isFinite(<number>seconds))
            return '-';
        if (seconds === 0)
            return '';
        var units = [ 'seconds', 'minutes', 'hours' ], number = Math.floor(Math
                .log(<number>seconds)
            / Math.log(60));
        return (<number>seconds / Math.pow(60, Math.floor(number))).toFixed(0) + ' '
            + units[number];
    };
};
