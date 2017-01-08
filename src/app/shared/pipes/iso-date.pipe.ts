import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isodate'
})
export class IsoDatePipe implements PipeTransform {

  transform(isoDate: string): any {
    const d = new Date(isoDate);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

}
