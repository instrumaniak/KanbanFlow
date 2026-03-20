import { IsEmail, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
