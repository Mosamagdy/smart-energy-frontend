import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
// import { environment } from '../../../environments/environment';
import { environment } from '../../../environments/environment.prod';
type JwtToken = string;

export interface BackendSuccess<T> {
  status: 'success';
  data: T;
  message?: string;
}

export type LoginStep1Result =
  | {
      requires_otp: true;
      user_id: number | string;
      message: string;
    }
  | {
      requires_otp: false;
      token: JwtToken;
      user: unknown;
    };

export interface AuthMeResponse {
  user: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  loginStep1(email: string, password: string): Observable<LoginStep1Result> {
    return this.http
      .post<BackendSuccess<LoginStep1Result>>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(map((r) => r.data));
  }

  verifyOtp(user_id: number | string, otp_code: string): Observable<{ token: JwtToken; user: unknown }> {
    return this.http
      .post<BackendSuccess<{ token: JwtToken; user: unknown }>>(`${this.apiUrl}/auth/verify-otp`, {
        user_id,
        otp_code,
      })
      .pipe(map((r) => r.data));
  }

  getMe(): Observable<unknown> {
    return this.http
      .get<BackendSuccess<AuthMeResponse>>(`${this.apiUrl}/auth/me`)
      .pipe(map((r) => r.data.user));
  }

  updatePassword(old_password: string, new_password: string): Observable<unknown> {
    return this.http
      .post<BackendSuccess<{ user: unknown }>>(`${this.apiUrl}/auth/update-password`, {
        old_password,
        new_password,
      })
      .pipe(map((r) => r.data.user));
  }
}

