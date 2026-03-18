import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { Peticion } from "../../servicios/peticion";
import { Router, RouterLink } from "@angular/router";

@Component({
  selector: "app-registro",
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./registro.html",
  styleUrl: "./registro.css",
})
export class Registro {
  firstName: string = "";
  lastName: string = "";
  email: string = "";
  username: string = "";
  password: string = "";
  password2: string = "";
  dateOfBirth: string = "";

  submitted: boolean = false;
  loading: boolean = false;

  serverError: string = "";
  serverSuccess: string = "";

  passwordError: string = "";
  password2Error: string = "";
  birthDateError: string = "";

  minDate: string = "";
  maxDate: string = "";

  constructor(
    private peticion: Peticion,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.configurarLimitesFecha();
  }

  configurarLimitesFecha(): void {
    const hoy = new Date();

    // Edad mínima: 13 años
    const max = new Date(hoy.getFullYear() - 13, hoy.getMonth(), hoy.getDate());

    // Edad máxima: 120 años
    const min = new Date(
      hoy.getFullYear() - 120,
      hoy.getMonth(),
      hoy.getDate(),
    );

    this.maxDate = this.formatearFecha(max);
    this.minDate = this.formatearFecha(min);
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  validarPassword(password: string): boolean {
    const regex = /^(?=(?:.*[a-z]){2,})(?=.*[A-Z])(?=(?:.*\d){2,}).{10,15}$/;
    return !!password && regex.test(password);
  }

  validarPasswords(): void {
    this.passwordError = "";
    this.password2Error = "";

    if (this.password && !this.validarPassword(this.password)) {
      this.passwordError = "La contraseña no cumple el formato requerido.";
    }

    if (this.password2 && this.password !== this.password2) {
      this.password2Error = "Las contraseñas no coinciden.";
    }
  }

  validarFechaNacimiento(): void {
    this.birthDateError = "";

    if (!this.dateOfBirth) return;

    const fechaNacimiento = new Date(this.dateOfBirth + "T00:00:00");
    const hoy = new Date();

    const edad = this.calcularEdad(fechaNacimiento, hoy);

    if (fechaNacimiento > hoy) {
      this.birthDateError = "La fecha de nacimiento no puede ser futura.";
      return;
    }

    if (edad < 13) {
      this.birthDateError = "Debes tener al menos 13 años para registrarte.";
      return;
    }

    if (edad > 120) {
      this.birthDateError = "La fecha de nacimiento no puede superar 120 años.";
      return;
    }
  }

  calcularEdad(fechaNacimiento: Date, fechaActual: Date): number {
    let edad = fechaActual.getFullYear() - fechaNacimiento.getFullYear();
    const mes = fechaActual.getMonth() - fechaNacimiento.getMonth();

    if (
      mes < 0 ||
      (mes === 0 && fechaActual.getDate() < fechaNacimiento.getDate())
    ) {
      edad--;
    }

    return edad;
  }

  formularioValido(form: NgForm): boolean {
    this.validarPasswords();
    this.validarFechaNacimiento();

    return (
      !!form.valid &&
      !this.passwordError &&
      !this.password2Error &&
      !this.birthDateError
    );
  }

  limpiarFeedback(): void {
    this.serverError = "";
    this.serverSuccess = "";
  }

  registrar(form: NgForm): void {
    this.submitted = true;
    this.limpiarFeedback();

    if (!this.formularioValido(form)) {
      this.serverError = "Corrige los campos marcados antes de continuar.";
      return;
    }

    this.loading = true;

    const payload = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      username: this.username.trim(),
      dateOfBirth: this.dateOfBirth,
    };

    const url = this.peticion.urlReal + "/api/auth/register";

    this.peticion
      .post(url, payload)
      .then((res: any) => {
        if (res?.role === "CLIENT") {
          this.serverSuccess =
            "Registro exitoso. Activa tu cuenta e inicia sesión.";
          form.resetForm();
          this.submitted = false;

          setTimeout(() => {
            this.router.navigate(["/"]);
          }, 1200);
        } else {
          this.serverSuccess = "Registro exitoso.";
          setTimeout(() => {
            this.router.navigate(["/"]);
          }, 1200);
        }
      })
      .catch((err: any) => {
        this.serverError =
          err?.error?.message ||
          "No fue posible completar el registro. Intenta nuevamente.";
      })
      .finally(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
  }
}
