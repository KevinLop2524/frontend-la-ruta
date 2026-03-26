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
  loadingResend: boolean = false; // ← nuevo

  serverError: string = "";
  serverSuccess: string = "";
  showResendButton: boolean = false; // ← nuevo

  // Mensaje exacto que dispara el botón de reenvío
  private readonly UNVERIFIED_MSG =
    "Por favor verifica tu correo antes de iniciar sesión. ¿Necesitas que reenviemos el email de verificación?";

  // ── Likes ──────────────────────────────────────
  likedPostIds: Set<number> = new Set();
  likingPostId: number | null = null;

  constructor(
    private peticion: Peticion,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  limpiarErroresDeCampo(): void {
    this.serverError = "";
    this.showResendButton = false; // ← limpiar junto al error
  }

  limpiarFeedback(): void {
    this.serverError = "";
    this.serverSuccess = "";
    this.showResendButton = false; // ← limpiar junto al feedback
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
      .then((res: any) => this.handleLoginSuccess(res))
      .catch((error: HttpErrorResponse) => this.handleLoginError(error))
      .finally(() => this.handleLoginFinally());
  }

  reenviarVerificacion(): void {
    if (!this.identifier.trim()) {
      this.serverError = "Ingresa tu correo para reenviar la verificación.";
      return;
    }

    this.loadingResend = true;

    // El backend espera el email como query param, payload vacío
    const email = encodeURIComponent(this.identifier.trim());
    const url = `${this.peticion.urlReal}/api/auth/resend-verification?email=${email}`;

    this.peticion
      .post(url, {})
      .then(() => {
        this.showResendButton = false;
        this.serverError = "";
        this.serverSuccess =
          "Correo de verificación reenviado. Revisa tu bandeja de entrada.";
      })
      .catch(() => {
        this.serverError = "No pudimos reenviar el correo. Intenta más tarde.";
        this.showResendButton = true;
      })
      .finally(() => {
        this.loadingResend = false;
        this.cdr.detectChanges();
      });
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
    }, 500);
  }

  private handleLoginError(error: any): void {
    const backendMsg: string = error.error?.message ?? "";

    const errorMessages: Record<number, string> = {
      400: backendMsg || "Error del servidor. Intenta más tarde.",
      401: "Usuario o contraseña incorrectos.",
      403: backendMsg || "Acceso denegado.",
      404: "Servicio no disponible.",
      500: "Error del servidor. Intenta más tarde.",
    };

    this.serverError =
      errorMessages[error.status] ??
      (backendMsg || "No fue posible iniciar sesión. Intenta nuevamente.");

    // Mostrar botón de reenvío solo cuando el backend indica correo sin verificar
    this.showResendButton = this.serverError === this.UNVERIFIED_MSG;
  }

  private handleLoginFinally(): void {
    this.loading = false;
    this.cdr.detectChanges();
  }

}
