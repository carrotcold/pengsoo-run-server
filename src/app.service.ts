import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getSiteName(): string {
    return 'Pengsoo Run Server';
  }
}
