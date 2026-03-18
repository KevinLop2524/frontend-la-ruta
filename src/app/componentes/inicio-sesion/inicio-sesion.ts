import { ChangeDetectorRef, Component } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { FormsModule, NgForm } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio-sesion',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.css'
})
export class InicioSesion {
  identifier: string = '';
  contrasena: string = '';

  submitted: boolean = false;
  loading: boolean = false;

  serverError: string = '';
  serverSuccess: string = '';

  constructor(private peticion: Peticion, private router: Router, private cdr: ChangeDetectorRef) { }

  limpiarErroresDeCampo(): void {
    this.serverError = '';
  }

  limpiarFeedback(): void {
    this.serverError = '';
    this.serverSuccess = '';
  }

  formularioValido(form: NgForm): boolean {
    return !!form.valid;
  }

  iniciar(form: NgForm): void {
    this.submitted = true;
    this.limpiarFeedback();

    if (!this.formularioValido(form)) {
      this.serverError = 'Completa correctamente los campos antes de continuar.';
      return;
    }

    this.loading = true;

    const payload = {
      identifier: this.identifier.trim(),
      password: this.contrasena
    };

    const url = this.peticion.urlReal + '/api/auth/login';

    this.peticion.post(url, payload).then((res: any) => {
      const identifierNormalizado = this.identifier.trim().toLowerCase();
      const username = res?.username?.toLowerCase?.() || '';
      const email = res?.email?.toLowerCase?.() || '';

      if (username === identifierNormalizado || email === identifierNormalizado) {
        this.serverSuccess = `Bienvenido ${res.username}`;

        localStorage.setItem('token', res.token);
        localStorage.setItem('apodo', res.username);
        localStorage.setItem('role', res.role);

        setTimeout(() => {
          if (localStorage.getItem('role') === 'ADMIN') {
            this.router.navigate(['BlogAdmin']);
          } else {
            this.router.navigate(['comunidades']);
          }
        }, 700);
      } else {
        this.serverError = 'No fue posible validar el inicio de sesión.';
      }
    }).catch((err: any) => {
      if (err?.status === 400 || err?.status === 401) {
        this.serverError = err?.error?.message || 'Usuario o contraseña incorrectos.';
      } else {
        this.serverError = 'No fue posible iniciar sesión. Intenta nuevamente.';
      }
    }).finally(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}