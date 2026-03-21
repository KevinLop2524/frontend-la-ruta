import { ChangeDetectorRef, Component } from "@angular/core";
import { Peticion } from "../../servicios/peticion";
import { FormsModule, NgForm } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
  selector: "app-inicio-sesion",
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: "./inicio-sesion.html",
  styleUrl: "./inicio-sesion.css",
})
export class InicioSesion {
  identifier: string = "";
  contrasena: string = "";

  submitted: boolean = false;
  loading: boolean = false;

  serverError: string = "";
  serverSuccess: string = "";

  constructor(
    private peticion: Peticion,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  limpiarErroresDeCampo(): void {
    this.serverError = "";
  }

  limpiarFeedback(): void {
    this.serverError = "";
    this.serverSuccess = "";
  }

  formularioValido(form: NgForm): boolean {
    return !!form.valid;
  }

  iniciar(form: NgForm): void {
    this.submitted = true;
    this.limpiarFeedback();

    if (form.invalid) {
      this.handleFormErrors(form);
      return;
    }

    this.loading = true;

    const payload = {
      identifier: this.identifier.trim(),
      password: this.contrasena,
    };

    const url = `${this.peticion.urlReal}/api/auth/login`;

    this.peticion
      .post(url, payload)
      .then((res: any) => {
        console.log(res);
        this.handleLoginSuccess(res)})
      .catch((error: HttpErrorResponse) => {
        console.log(error);
        this.handleLoginError(error)})
      .finally(() => this.handleLoginFinally());
  }

  private handleFormErrors(form: NgForm): void {
    const firstInvalidControl = Object.keys(form.controls).find(
      (key) => form.controls[key].invalid,
    );

    this.serverError = firstInvalidControl
      ? `Completa ambos campos antes de continuar.`
      : "Completa correctamente los campos antes de continuar.";
  }

  private handleLoginSuccess(res: any): void {
    const identifierNormalizado = this.identifier.trim().toLowerCase();
    const username = res.username?.toLowerCase?.() || "";
    const email = res.email?.toLowerCase?.() || "";

    if (username === identifierNormalizado || email === identifierNormalizado) {
      this.serverSuccess = `Bienvenido ${res.username}`;
      this.storeUserData(res);
      this.scheduleNavigation();
    } else {
      this.serverError = "No fue posible validar el inicio de sesión.";
    }
  }

  private storeUserData(res: any): void {
    // Considerar usar un servicio de almacenamiento seguro
    localStorage.setItem("token", res.token);
    localStorage.setItem("apodo", res.username);
    localStorage.setItem("role", res.role);
    localStorage.setItem("user", JSON.stringify(res));
  }

  private scheduleNavigation(): void {
    setTimeout(() => {
      const role = localStorage.getItem("role");
      const route = role === "ADMIN" ? ["BlogAdmin"] : ["comunidades"];
      this.router.navigate(route);
    }, 500); // 500ms es suficiente para feedback visual
  }

  private handleLoginError(error: any): void {
    const errorMessages: Record<number, string> = {
      400: error.error?.message || "Error del servidor. Intenta más tarde.",
      401: "Usuario o contraseña incorrectos.",
      403: "Acceso denegado.",
      404: "Servicio no disponible.",
      500: "Error del servidor. Intenta más tarde.",
    };

    this.serverError =
      errorMessages[error.status] ||
      error.error?.message ||
      "No fue posible iniciar sesión. Intenta nuevamente.";
  }

  private handleLoginFinally(): void {
    this.loading = false;
    this.cdr.detectChanges();
  }
}
