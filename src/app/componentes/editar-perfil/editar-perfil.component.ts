import { Header } from "../header/header";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Peticion } from "../../servicios/peticion";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Footer } from "../footer/footer";
import { RouterModule } from "@angular/router";
import { userZodValidator } from "../../validators/userUpdate";

interface PerfilEditar {
  firstName: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  dateOfBirth: string;
  height: string | number;
  gender: string | null;
  weight: string | number;
}

interface FormErrors {
  firstName?: string;
  secondName?: string;
  lastName?: string;
  secondLastName?: string;
  dateOfBirth?: string;
  height?: string;
  gender?: string;
  weight?: string;
  general?: string;
}

@Component({
  selector: "app-editar-perfil",
  standalone: true,
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: "./editar-perfil.component.html",
  styleUrl: "./editar-perfil.component.css",
  providers: [userZodValidator],
})
export class EditarPerfilComponent implements OnInit {
  constructor(
    private peticion: Peticion,
    private validar: userZodValidator,
    private cdr: ChangeDetectorRef,
    private uploadService: Peticion,
  ) {}

  perfilEditar: PerfilEditar = {
    firstName: "",
    secondName: "",
    lastName: "",
    secondLastName: "",
    dateOfBirth: "",
    height: "",
    gender: null,
    weight: "",
  };

  perfilOriginal: PerfilEditar = {
    firstName: "",
    secondName: "",
    lastName: "",
    secondLastName: "",
    dateOfBirth: "",
    height: "",
    gender: null,
    weight: "",
  };

  selectedImageFile: File | null = null;
  selectedImageName = "";
  previewImageUrl: string | null = null;

  uploadingImage = false;
  imageError = "";

  avatarVersion = Date.now();

  usuario: any = {};

  loadingUser = false;
  saving = false;

  serverSuccess = "";
  serverError = "";

  formErrors: FormErrors = {};

  private readonly TIPOS_IMAGEN_PERMITIDOS = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  private readonly TAMANIO_MAXIMO_IMAGEN_MB = 5;

  ngOnInit(): void {
    this.buscarUsuario();
  }

  obtenerFotoPerfil(): string {
    if (this.usuario?.avatar_url) {
      return `${this.usuario.avatar_url}?t=${this.avatarVersion}`;
    }
    return "/imagenes/static/imgGymUno.jpg";
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = "/imagenes/static/imgGymUno.jpg";
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.imageError = "";
    this.serverError = "";
    this.serverSuccess = "";

    if (!file) return;

    if (!this.TIPOS_IMAGEN_PERMITIDOS.includes(file.type)) {
      this.imageError =
        "Solo puedes subir imágenes en formato PNG, JPG o WEBP.";
      input.value = "";
      return;
    }

    const tamanioMaximoBytes = this.TAMANIO_MAXIMO_IMAGEN_MB * 1024 * 1024;
    if (file.size > tamanioMaximoBytes) {
      this.imageError = `La imagen no debe superar los ${this.TAMANIO_MAXIMO_IMAGEN_MB} MB.`;
      input.value = "";
      return;
    }

    this.selectedImageFile = file;
    this.selectedImageName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImageUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  cancelarSeleccionImagen(): void {
    this.selectedImageFile = null;
    this.selectedImageName = "";
    this.previewImageUrl = null;
    this.imageError = "";

    const input = document.getElementById(
      "fotoPerfil",
    ) as HTMLInputElement | null;
    if (input) {
      input.value = "";
    }
  }

  subirImagenPerfil(): void {
    this.imageError = "";
    this.serverError = "";
    this.serverSuccess = "";

    if (!this.selectedImageFile) {
      this.imageError = "Selecciona una imagen antes de continuar.";
      return;
    }

    if (!this.usuario?.id) {
      this.serverError = "No se pudo identificar al usuario actual.";
      return;
    }

    this.uploadingImage = true;

    const url = `${this.peticion.urlReal}/api/users/${this.usuario.id}/images/avatar`;

    this.uploadService.UploadFile(this.selectedImageFile, url).subscribe({
      next: (res: any) => {
        this.serverSuccess =
          this.traducirMensajeBackend(res?.message) ||
          "La foto de perfil se actualizó correctamente.";

        const nuevaUrl =
          res?.imageUrl ||
          res?.data?.imageUrl ||
          res?.profileImage ||
          res?.data?.profileImageUrl ||
          res?.avatar_url ||
          null;

        if (nuevaUrl) {
          this.usuario.avatar_url = nuevaUrl;
        }

        this.avatarVersion = Date.now();
        this.cancelarSeleccionImagen();
        this.uploadingImage = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.serverError = this.obtenerMensajeError(
          err,
          "No fue posible actualizar la foto de perfil.",
        );
        this.uploadingImage = false;
        this.cdr.detectChanges();
      },
    });
  }

  fechaMinima(): string {
    const hoy = new Date();
    hoy.setFullYear(hoy.getFullYear() - 90);
    return this.formatearFecha(hoy);
  }

  fechaMaxima(): string {
    const hoy = new Date();
    hoy.setFullYear(hoy.getFullYear() - 18);
    return this.formatearFecha(hoy);
  }

  private formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
  }

  private limpiarMensajes(): void {
    this.serverSuccess = "";
    this.serverError = "";
    this.formErrors = {};
  }

  private hayCambiosEnPerfil(): boolean {
    return (
      this.perfilEditar.firstName.trim() !==
        this.perfilOriginal.firstName.trim() ||
      this.perfilEditar.secondName.trim() !==
        this.perfilOriginal.secondName.trim() ||
      this.perfilEditar.lastName.trim() !==
        this.perfilOriginal.lastName.trim() ||
      this.perfilEditar.secondLastName.trim() !==
        this.perfilOriginal.secondLastName.trim() ||
      this.perfilEditar.dateOfBirth !== this.perfilOriginal.dateOfBirth ||
      String(this.perfilEditar.height ?? "").trim() !==
        String(this.perfilOriginal.height ?? "").trim() ||
      String(this.perfilEditar.weight ?? "").trim() !==
        String(this.perfilOriginal.weight ?? "").trim() ||
      this.perfilEditar.gender !== this.perfilOriginal.gender
    );
  }

  private mapearUsuarioAFormulario(usuario: any): void {
    const datosFormulario: PerfilEditar = {
      firstName: usuario.firstName || "",
      secondName: usuario.secondName || "",
      lastName: usuario.lastName || "",
      secondLastName: usuario.secondLastName || "",
      gender: usuario.gender || null,
      dateOfBirth: usuario.dateOfBirth ? usuario.dateOfBirth.split("T")[0] : "",
      height: usuario.height != null ? String(usuario.height) : "",
      weight: usuario.weight != null ? String(usuario.weight) : "",
    };

    this.perfilEditar = { ...datosFormulario };
    this.perfilOriginal = { ...datosFormulario };
  }

  buscarUsuario(): void {
    this.loadingUser = true;
    this.limpiarMensajes();

    const token = localStorage.getItem("token") || undefined;
    const userId = JSON.parse(localStorage.getItem("user") || "{}").userId;

    if (!token || !userId) {
      this.loadingUser = false;
      this.serverError = "No se encontró una sesión activa.";
      return;
    }

    const url = `${this.peticion.urlReal}/api/users/get/${userId}`;

    this.peticion
      .get(url, token)
      .then((res: any) => {
        this.usuario = res;
        this.mapearUsuarioAFormulario(res);
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        this.serverError = this.obtenerMensajeError(
          err,
          "No fue posible cargar la información del perfil.",
        );
        this.cdr.detectChanges();
      })
      .finally(() => {
        this.loadingUser = false;
      });
  }

  limpiarErrorCampo(campo: keyof FormErrors): void {
    if (this.formErrors[campo]) {
      delete this.formErrors[campo];
    }

    if (this.formErrors.general) {
      delete this.formErrors.general;
    }

    this.serverError = "";
    this.serverSuccess = "";
  }

  private validarFormulario(): boolean {
    this.formErrors = {};
    this.serverError = "";
    this.serverSuccess = "";

    const data = {
      ...this.perfilEditar,
      firstName: String(this.perfilEditar.firstName ?? "").trim(),
      secondName: String(this.perfilEditar.secondName ?? "").trim(),
      lastName: String(this.perfilEditar.lastName ?? "").trim(),
      secondLastName: String(this.perfilEditar.secondLastName ?? "").trim(),
      height: String(this.perfilEditar.height ?? "").trim(),
      weight: String(this.perfilEditar.weight ?? "").trim(),
    };

    const resultado = this.validar.validar(data);

    if (!resultado.ok) {
      this.formErrors.general =
        this.traducirMensajeBackend(resultado.error || "") ||
        "Revisa la información ingresada.";
    }

    if (!data.firstName) {
      this.formErrors.firstName = "El nombre es obligatorio.";
    }

    if (!data.lastName) {
      this.formErrors.lastName = "El apellido es obligatorio.";
    }

    const fechaNacimiento = this.perfilEditar.dateOfBirth;
    if (!fechaNacimiento) {
      this.formErrors.dateOfBirth = "La fecha de nacimiento es obligatoria.";
    } else {
      const fechaSeleccionada = new Date(fechaNacimiento);
      const min = new Date(this.fechaMinima());
      const max = new Date(this.fechaMaxima());

      if (fechaSeleccionada < min || fechaSeleccionada > max) {
        this.formErrors.dateOfBirth =
          "La fecha de nacimiento debe corresponder a una edad entre 18 y 90 años.";
      }
    }

    const heightValue = String(this.perfilEditar.height ?? "").trim();
    const height = Number(heightValue);

    if (!heightValue) {
      this.formErrors.height = "La altura es obligatoria.";
    } else if (Number.isNaN(height) || height < 50 || height > 300) {
      this.formErrors.height = "Ingresa una altura válida entre 50 y 300 cm.";
    }

    const weightValue = String(this.perfilEditar.weight ?? "").trim();
    const weight = Number(weightValue);

    if (!weightValue) {
      this.formErrors.weight = "El peso es obligatorio.";
    } else if (Number.isNaN(weight) || weight < 20 || weight > 500) {
      this.formErrors.weight = "Ingresa un peso válido entre 20 y 500 kg.";
    }

    if (!this.perfilEditar.gender) {
      this.formErrors.gender = "Selecciona una opción en el campo sexo.";
    }

    if (Object.keys(this.formErrors).some((k) => k !== "general")) {
      this.formErrors.general =
        "Revisa los campos marcados antes de continuar.";
    }

    return (
      Object.keys(this.formErrors).filter((k) => k !== "general").length === 0
    );
  }

  actualizarPerfil(): void {
    if (this.saving) return;

    const esValido = this.validarFormulario();
    if (!esValido) return;

    if (!this.hayCambiosEnPerfil()) {
      this.serverError = "";
      this.serverSuccess = "No hay cambios para guardar.";
      return;
    }

    const token = localStorage.getItem("token") || undefined;

    if (!token || !this.usuario?.id) {
      this.serverError = "No se encontró una sesión activa del usuario.";
      return;
    }

    this.saving = true;
    this.serverError = "";
    this.serverSuccess = "";

    const payload = {
      firstName: String(this.perfilEditar.firstName ?? "").trim(),
      secondName: String(this.perfilEditar.secondName ?? "").trim(),
      lastName: String(this.perfilEditar.lastName ?? "").trim(),
      secondLastName: String(this.perfilEditar.secondLastName ?? "").trim(),
      gender: this.perfilEditar.gender,
      dateOfBirth: this.perfilEditar.dateOfBirth,
      height: Number(String(this.perfilEditar.height ?? "").trim()),
      weight: Number(String(this.perfilEditar.weight ?? "").trim()),
    };

    const url = `${this.peticion.urlReal}/api/users/update/${this.usuario.id}`;

    this.peticion
      .patch(url, payload, token)
      .then((res: any) => {
        this.usuario = res ?? { ...this.usuario, ...payload };

        this.perfilOriginal = {
          firstName: payload.firstName,
          secondName: payload.secondName,
          lastName: payload.lastName,
          secondLastName: payload.secondLastName,
          gender: payload.gender,
          dateOfBirth: payload.dateOfBirth,
          height: String(payload.height),
          weight: String(payload.weight),
        };

        if (this.usuario?.username) {
          localStorage.setItem("apodo", this.usuario.username);
        }

        this.serverSuccess = "Tu perfil se actualizó correctamente.";
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        this.serverError = this.obtenerMensajeError(
          err,
          "No fue posible actualizar el perfil.",
        );
        this.cdr.detectChanges();
      })
      .finally(() => {
        this.saving = false;
        this.cdr.detectChanges();
      });
  }

  tieneError(campo: keyof FormErrors): boolean {
    return !!this.formErrors[campo];
  }

  private traducirMensajeBackend(mensaje: string): string {
    if (!mensaje) return "";

    const mapa: Record<string, string> = {
      "Profile updated successfully": "Tu perfil se actualizó correctamente.",
      "User updated successfully": "Tu perfil se actualizó correctamente.",
      "Invalid file type":
        "El archivo seleccionado no tiene un formato permitido.",
      "File too large": "La imagen supera el tamaño máximo permitido.",
      Unauthorized: "Tu sesión ha expirado. Inicia sesión nuevamente.",
      Forbidden: "No tienes permisos para realizar esta acción.",
      "User not found": "No se encontró el usuario.",
    };

    if (mapa[mensaje]) {
      return mapa[mensaje];
    }

    const msg = mensaje.toLowerCase();

    if (msg.includes("unauthorized"))
      return "Tu sesión ha expirado. Inicia sesión nuevamente.";
    if (msg.includes("forbidden"))
      return "No tienes permisos para realizar esta acción.";
    if (msg.includes("not found"))
      return "No se encontró la información solicitada.";
    if (msg.includes("invalid file"))
      return "La imagen seleccionada no es válida.";
    if (msg.includes("file too large"))
      return "La imagen supera el tamaño máximo permitido.";
    if (msg.includes("network"))
      return "No se pudo establecer conexión con el servidor.";

    return mensaje;
  }

  private obtenerMensajeError(error: any, fallback: string): string {
    const mensaje =
      error?.error?.message || error?.error?.mensaje || error?.message || "";

    if (mensaje) {
      return this.traducirMensajeBackend(mensaje);
    }

    const status = error?.status;

    if (status === 0) return "No fue posible conectar con el servidor.";
    if (status === 400) return "Hay datos inválidos en la solicitud.";
    if (status === 401)
      return "Tu sesión ha expirado. Inicia sesión nuevamente.";
    if (status === 403) return "No tienes permisos para realizar esta acción.";
    if (status === 404) return "No se encontró la información solicitada.";
    if (status >= 500) return "Ocurrió un error interno en el servidor.";

    return fallback;
  }
}
