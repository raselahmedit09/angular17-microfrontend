import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormatPipe',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {

  transform(value: Date | string, ...args: any[]): any {
    var datePipe = new DatePipe("en-US");

    if (args[0])
      return datePipe.transform(value, 'MM-dd-yyyy h:mm a');
    else
      return datePipe.transform(value, 'MM-dd-yyyy');
  }


}
