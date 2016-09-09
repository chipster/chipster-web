export default function() {
    return function(isoDate: string) {
        let d = new Date(isoDate);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    };
};