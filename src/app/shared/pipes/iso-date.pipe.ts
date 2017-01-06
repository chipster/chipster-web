import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isodate'
})
export class IsoDatePipe implements PipeTransform {

  transform(isoDate: string): any {
    let d = new Date(isoDate);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

}
