import { Header } from "../header/header";
import { Peticion } from "../../servicios/peticion";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { Footer } from "../footer/footer";

@Component({
  selector: "app-perfil",
  standalone: true,
  imports: [Header, FormsModule, RouterModule, CommonModule, Footer],
  templateUrl: "./perfil.html",
  styleUrl: "./perfil.css",
})
export class Perfil implements OnInit {
  usuario: any = {};
  fraseMoti: any = {};

  loadingUsuario: boolean = false;
  uploadingImage: boolean = false;
  userStorage: any = {};

  generalError: string = "";
  generalSuccess: string = "";
  imageError: string = "";

  selectedImageFile: File | null = null;
  selectedImageName: string = "";
  previewImageUrl: string | null = null;
  apodo: string | null = null;

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
    private uploadService: Peticion,
  ) {}

  ngOnInit(): void {
    this.buscarUsuario();
    this.obtenerFraseMotivacional();
  }

  limpiarFeedbackGeneral(): void {
    this.generalError = "";
    this.generalSuccess = "";
  }

  obtenerFraseMotivacional(): void {
    const token = localStorage.getItem("token") || undefined;
    const url = `${this.peticion.urlReal}/api/frase`;

    this.peticion
      .get(url, token)
      .then((res: any) => {
        this.fraseMoti = Array.isArray(res) ? res[0] || {} : res || {};
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error("Error al obtener frase motivacional", err);
      });
  }

  buscarUsuario(): void {
    this.loadingUsuario = true;
    this.limpiarFeedbackGeneral();

    const userStorage2 = localStorage.getItem("user") || "";

    if (localStorage.getItem("user"))
      this.userStorage = JSON.parse(localStorage.getItem("user") || "");

    console.log(this.userStorage);
    const token = localStorage.getItem("token");
    this.apodo = localStorage.getItem("apodo");

    if (!this.userStorage || !token) {
      this.generalError = "No se pudo identificar la sesión actual.";
      this.loadingUsuario = false;
      return;
    }

    let user;

    try {
      user = JSON.parse(userStorage2);
    } catch (error) {
      console.error("Error parseando user del localStorage", error);
      this.generalError = "No se pudo leer la información del usuario actual.";
      this.loadingUsuario = false;
      return;
    }

    if (!user?.id) {
      this.generalError = "El usuario actual no tiene un identificador válido.";
      this.loadingUsuario = false;
      return;
    }

    const url = `${this.peticion.urlReal}/api/users/get/${user.id}`;

    this.peticion
      .get(url, token)
      .then((res: any) => {
        this.usuario = res?.data || res || {};
        console.log(this.usuario);
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error("Error al encontrar usuario", err);
        this.generalError = "No fue posible cargar la información del perfil.";
      })
      .finally(() => {
        this.loadingUsuario = false;
        this.cdr.detectChanges();
      });
  }

  onImageSelected(event: Event): void {
    this.imageError = "";
    this.generalError = "";
    this.generalSuccess = "";

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      this.imageError = "Formato no permitido. Usa JPG, PNG o WEBP.";
      this.resetImageSelection(input);
      return;
    }

    if (file.size > maxSizeBytes) {
      this.imageError = "La imagen no puede superar 5 MB.";
      this.resetImageSelection(input);
      return;
    }

    this.selectedImageFile = file;
    this.selectedImageName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImageUrl = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  cancelarSeleccionImagen(): void {
    this.selectedImageFile = null;
    this.selectedImageName = "";
    this.previewImageUrl = null;
    this.imageError = "";

    const input = document.getElementById(
      "pfImageInput",
    ) as HTMLInputElement | null;
    if (input) {
      input.value = "";
    }
  }

  resetImageSelection(input?: HTMLInputElement | null): void {
    this.selectedImageFile = null;
    this.selectedImageName = "";
    this.previewImageUrl = null;

    if (input) {
      input.value = "";
    }
  }

  subirImagenPerfil(): void {
    this.limpiarFeedbackGeneral();
    this.imageError = "";

    if (!this.selectedImageFile) {
      this.imageError = "Primero selecciona una imagen.";
      return;
    }

    if (!this.usuario?.id) {
      this.generalError = "No se pudo identificar el usuario actual.";
      return;
    }

    this.uploadingImage = true;

    const url = `${this.peticion.urlReal}/api/users/${this.usuario.id}/images/avatar`;

    this.uploadService.UploadFile(this.selectedImageFile, url).subscribe({
      next: (res: any) => {
        this.generalSuccess =
          res?.message || "Foto de perfil actualizada correctamente.";

        const nuevaUrl =
          res?.imageUrl || res?.data?.imageUrl || res?.profileImage || null;

        if (nuevaUrl) {
          this.usuario.profileImageUrl = nuevaUrl;
        }

        this.cancelarSeleccionImagen();
        this.uploadingImage = false;
        this.cdr.detectChanges();
      },

      error: (err: any) => {
        console.error("Error al subir la imagen de perfil", err);

        this.generalError =
          err?.error?.message ||
          err?.error?.mensaje ||
          "No fue posible actualizar la foto de perfil.";

        this.uploadingImage = false;
        this.cdr.detectChanges();
      },
    });
  }

  obtenerFotoPerfil(): string {
    return (
      this.usuario?.profileImageUrl ||
      this.usuario?.photoUrl ||
      this.usuario?.avatarUrl ||
      "imagenes/static/Fotoperfil.jpg"
    );
  }

  obtenerNombreCompleto(): string {
    return (
      [this.usuario?.nombre, this.usuario?.apellido]
        .filter((valor) => !!valor && String(valor).trim() !== "")
        .join(" ") || "No disponible"
    );
  }

  obtenerNombres(): string {
    return (
      [this.usuario?.nombre, this.usuario?.apellido]
        .filter((valor) => !!valor && String(valor).trim() !== "")
        .join(" ") || "No disponible"
    );
  }

  obtenerApellidos(): string {
    return (
      [this.usuario?.apellido]
        .filter((valor) => !!valor && String(valor).trim() !== "")
        .join(" ") || "No disponible"
    );
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return "No disponible";

    const date = new Date(fecha);
    if (isNaN(date.getTime())) return fecha;

    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
}
