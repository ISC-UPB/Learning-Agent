import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'DateRangeValidator', async: false })
export class DateRangeValidator implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments): boolean {
    const dto = args.object as any;
    return dto.dateBegin < dto.dateEnd;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'dateBegin must be earlier than dateEnd.';
  }
}
