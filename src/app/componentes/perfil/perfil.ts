import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { Peticion } from "../../servicios/peticion";

@Component({
  selector: "app-perfil",
  standalone: true,
  imports: [Header, FormsModule, RouterModule, CommonModule, Footer],
  templateUrl: "./perfil.html",
  styleUrl: "./perfil.css",
})
export class Perfil implements OnInit {
  usuario: any = {};
  userStorage: any = {};

  loadingUsuario = false;
  uploadingImage = false;

  generalError = "";
  generalSuccess = "";
  imageError = "";

  selectedImageFile: File | null = null;
  selectedImageName = "";
  previewImageUrl: string | null = null;

  apodo: string | null = null;
  avatarVersion = Date.now();

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
    private uploadService: Peticion,
  ) {}

  ngOnInit(): void {
    this.buscarUsuario();
  }

  limpiarFeedbackGeneral(): void {
    this.generalError = "";
    this.generalSuccess = "";
  }

  buscarUsuario(): void {
    this.loadingUsuario = true;
    this.limpiarFeedbackGeneral();

    const userRaw = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    this.apodo = localStorage.getItem("apodo");

    if (!userRaw || !token) {
      this.generalError = "No se pudo identificar la sesión actual.";
      this.loadingUsuario = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      this.userStorage = JSON.parse(userRaw);
    } catch (error) {
      console.error("Error parseando user del localStorage", error);
      this.generalError = "No se pudo leer la información del usuario actual.";
      this.loadingUsuario = false;
      this.cdr.detectChanges();
      return;
    }

    if (!this.userStorage?.userId) {
      this.generalError = "El usuario actual no tiene un identificador válido.";
      this.loadingUsuario = false;
      this.cdr.detectChanges();
      return;
    }

    const url = `${this.peticion.urlReal}/api/users/get/${this.userStorage.userId}`;

    this.peticion
      .get(url, token)
      .then((res: any) => {
        console.log(res)
        this.usuario = res?.data || res || {};
        console.log(this.usuario)
        this.avatarVersion = Date.now();
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

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      this.imageError = "Formato no permitido. Usa JPG, PNG o WEBP.";
      this.resetImageSelection(input);
      this.cdr.detectChanges();
      return;
    }

    if (file.size > maxSizeBytes) {
      this.imageError = "La imagen no puede superar 5 MB.";
      this.resetImageSelection(input);
      this.cdr.detectChanges();
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

    const input = document.getElementById("pfImageInput") as HTMLInputElement | null;
    if (input) {
      input.value = "";
    }

    this.cdr.detectChanges();
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
      this.cdr.detectChanges();
      return;
    }

    if (!this.usuario?.id) {
      this.generalError = "No se pudo identificar el usuario actual.";
      this.cdr.detectChanges();
      return;
    }

    this.uploadingImage = true;

    const url = `${this.peticion.urlReal}/api/users/${this.usuario.id}/images/avatar`;
    console.log(url);
    this.uploadService.UploadFile(this.selectedImageFile, url).subscribe({
      next: (res: any) => {
        this.generalSuccess =
          res?.message || "Foto de perfil actualizada correctamente.";
        console.log(res);
        const nuevaUrl =
          res?.imageUrl ||
          res?.data?.imageUrl ||
          res?.profileImage ||
          res?.data?.profileImageUrl ||
          null;

        if (nuevaUrl) {
          this.usuario.profileImageUrl = nuevaUrl;
          this.usuario.avatarUrl = nuevaUrl;
        }

        this.previewImageUrl = null;
        this.avatarVersion = Date.now();

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
    
    console.log(this.usuario.avatar_url);
    console.log(this.usuario);

    if (this.usuario?.avatar_url) {
      return `${this.usuario.avatar_url}?t=${this.avatarVersion}`;
    }


    return "/imagenes/static/imgGymUno.jpg";

  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = "/imagenes/static/imgGymUno.jpg";
  }

  obtenerNombreCompleto(): string {
    const nombres = [
      this.usuario?.firstName ?? this.usuario?.nombre ?? "",
      this.usuario?.secondName ?? "",
      this.usuario?.lastName ?? this.usuario?.apellido ?? "",
      this.usuario?.secondLastName ?? "",
    ]
      .map((valor) => String(valor).trim())
      .filter((valor) => valor !== "");

    return nombres.join(" ") || "No disponible";
  }

  obtenerNombres(): string {
    const nombres = [
      this.usuario?.firstName ?? this.usuario?.nombre ?? "",
      this.usuario?.secondName ?? "",
    ]
      .map((valor) => String(valor).trim())
      .filter((valor) => valor !== "");

    return nombres.join(" ") || "No disponible";
  }

  obtenerApellidos(): string {
    const apellidos = [
      this.usuario?.lastName ?? this.usuario?.apellido ?? "",
      this.usuario?.secondLastName ?? "",
    ]
      .map((valor) => String(valor).trim())
      .filter((valor) => valor !== "");

    return apellidos.join(" ") || "No disponible";
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