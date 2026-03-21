import { Header } from '../header/header';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Footer } from '../footer/footer';
import { RouterModule } from '@angular/router';
import { z } from 'zod';

const publicacionSchema = z.object({
  contenido: z.string()
    .min(1, 'Contenido requerido')
    .regex(/[a-zA-ZÁÉÍÓÚáéíóúÑñ0-9]/, 'El contenido es inválido'),
  type: z.string().min(1, 'El tipo es requerido'),
  comunidadId: z.number().optional()
});

@Component({
  selector: 'app-publicacion',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './blog-principal.html',
  styleUrls: ['./blog-principal.css']
})
export class BlogPrincipal implements OnInit {
  usuario: any = {};
  publicaciones: any[] = [];

  loadingUsuario: boolean = false;
  loadingPosts: boolean = false;
  creatingPost: boolean = false;
  updatingPost: boolean = false;
  deletingPostId: number | null = null;

  createOpen: boolean = false;
  editMode: boolean = false;
  confirmandoId: number | null = null;

  submittedCreate: boolean = false;
  submittedEdit: boolean = false;

  generalError: string = '';
  generalSuccess: string = '';
  createError: string = '';
  createSuccess: string = '';
  editError: string = '';
  editSuccess: string = '';

  selectedCreateImageFile: File | null = null;
  selectedCreateImageName: string = '';
  createImagePreview: string | null = null;
  createImageError: string = '';

  selectedEditImageFile: File | null = null;
  selectedEditImageName: string = '';
  editImagePreview: string | null = null;
  editImageError: string = '';
  editImageTargetId: number | null = null;

  nuevaPublicacion: any = {
    contenido: '',
    tipo: 'USER',
    authorId: null,
    comunidadId: null,
    imageUrl: null
  };

  publicacionEditar: any = {
    id: null,
    contenido: '',
    tipo: 'COMMUNITY',
    authorId: null,
    comunidadId: null,
    imageUrl: null
  };

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
    private uploadService: Peticion
  ) { }

  ngOnInit(): void {
    this.buscarUsuario();
    this.cargarPublicaciones();
  }

  limpiarFeedbackGeneral(): void {
    this.generalError = '';
    this.generalSuccess = '';
  }

  limpiarFeedbackCrear(): void {
    this.createError = '';
    this.createSuccess = '';
    this.generalError = '';
  }

  limpiarFeedbackEdicion(): void {
    this.editError = '';
    this.editSuccess = '';
  }

  buscarUsuario(): void {
    this.loadingUsuario = true;

    const userStorage = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStorage || !token) {
      this.generalError = 'No se pudo identificar el usuario actual.';
      this.loadingUsuario = false;
      this.cdr.detectChanges();

      return;
    }

    let user;

    try {
      user = JSON.parse(userStorage);
    } catch (error) {
      console.error('Error parseando user del localStorage', error);
      this.generalError = 'No se pudo leer la sesión actual.';
      this.loadingUsuario = false;
      this.cdr.detectChanges();

      return;
    }

    if (!user?.userId) {
      this.generalError = 'El usuario actual no tiene un identificador válido.';
      this.loadingUsuario = false;
      this.cdr.detectChanges();

      return;
    }

    const url = `${this.peticion.urlReal}/api/users/get/${user.userId}`;

    this.peticion.get(url, token)
      .then((res: any) => {
        this.usuario = res?.data || res || {};
        this.nuevaPublicacion.authorId = this.usuario.id;
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error al encontrar usuario', err);
        this.generalError = 'No fue posible cargar el usuario actual.';
      })
      .finally(() => {
        this.loadingUsuario = false;
        this.cdr.detectChanges();

      });
  }

  cargarPublicaciones(): void {
    this.loadingPosts = true;
    const url = `${this.peticion.urlReal}/api/posts/feed/global`;

    this.peticion.get(url)
      .then((res: any) => {
        this.peticion.get(url)
          .then((res: any) => {
            const data = Array.isArray(res) ? res : [];

            this.publicaciones = data.slice(0, 10);

            console.log(this.publicaciones);
            this.cdr.detectChanges();
          })
        console.log(this.publicaciones)
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error al obtener publicaciones', err);
        this.generalError = 'No fue posible cargar las publicaciones.';
        this.publicaciones = [];
      })
      .finally(() => {
        this.loadingPosts = false;
        this.cdr.detectChanges();

      });
  }

  validarArchivoImagen(file: File | null): string {
    if (!file) return '';

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return 'Formato no permitido. Usa JPG, PNG o WEBP.';
    }

    if (file.size > maxSizeBytes) {
      return 'La imagen no puede superar 5 MB.';
    }

    return '';
  }

  onCreateImageSelected(event: Event): void {
    this.createImageError = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    const error = this.validarArchivoImagen(file);
    if (error) {
      this.createImageError = error;
      this.selectedCreateImageFile = null;
      this.selectedCreateImageName = '';
      this.createImagePreview = null;
      input.value = '';
      return;
    }

    if (!file) return;

    this.selectedCreateImageFile = file;
    this.selectedCreateImageName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.createImagePreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  onEditImageSelected(event: Event, postId: number): void {
    this.editImageError = '';
    this.editImageTargetId = postId;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    const error = this.validarArchivoImagen(file);
    if (error) {
      this.editImageError = error;
      this.selectedEditImageFile = null;
      this.selectedEditImageName = '';
      this.editImagePreview = null;
      input.value = '';
      return;
    }

    if (!file) return;

    this.selectedEditImageFile = file;
    this.selectedEditImageName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.editImagePreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  validarPayloadPublicacion(payload: any): string {
    const resultado = publicacionSchema.safeParse(payload);

    if (!resultado.success) {
      return resultado.error.errors[0]?.message || 'Datos inválidos.';
    }

    return '';
  }

  async crearPublicacion(): Promise<void> {
  this.submittedCreate = true;
  this.limpiarFeedbackCrear();

  if (!this.nuevaPublicacion.contenido?.trim()) {
    this.createError = 'El contenido es obligatorio.';
    return;
  }

  this.creatingPost = true;

  try {
    const token = localStorage.getItem('token') || undefined;

    let url = `${this.peticion.urlReal}/api/posts`;
    let postCreado: any;

    // 🔹 CASO: PUBLICACIÓN EN COMUNIDAD
    if (this.nuevaPublicacion.tipo === 'COMMUNITY') {
      const comunidadId = Number(this.nuevaPublicacion.comunidadId);

      if (!comunidadId) {
        this.createError = 'Debes seleccionar una comunidad.';
        this.creatingPost = false;
        return;
      }

      const formData = new FormData();

      formData.append('data', JSON.stringify({
        contenido: this.nuevaPublicacion.contenido.trim()
      }));

      if (this.selectedCreateImageFile) {
        formData.append('media', this.selectedCreateImageFile);
      }

      url = `${this.peticion.urlReal}/api/posts/communities/${comunidadId}`;

      postCreado = await this.peticion.post(url, formData, token);

    } 
    // 🔹 CASO: PUBLICACIÓN NORMAL
    else {
      const payload: any = {
        contenido: this.nuevaPublicacion.contenido.trim(),
        type: this.nuevaPublicacion.tipo
      };

      postCreado = await this.peticion.post(url, payload, token);
    }

    if (this.selectedCreateImageFile) {
      await this.subirImagenPost(postCreado.id);
    }

    this.createSuccess = 'Publicación creada correctamente.';
    this.generalSuccess = 'Tu publicación se agregó al feed.';

    this.cargarPublicaciones();
    this.closeCreate();

  } catch (err: any) {
    console.error(err);
    this.createError =
      err?.error?.message ||
      'Error al crear publicación';
  } finally {
    this.creatingPost = false;
    this.cdr.detectChanges();
  }
}

  eliminarPublicacion(idSeleccionado: number): void {
    this.deletingPostId = idSeleccionado;
    this.limpiarFeedbackGeneral();

    const token = localStorage.getItem('token') || undefined;
    const url = `${this.peticion.urlReal}/api/publicaciones/${idSeleccionado}`;

    this.peticion.delete(url, token ? { token } : {})
      .then(() => {
        this.generalSuccess = 'La publicación fue eliminada correctamente.';
        this.toggleConfirmar(null);
        this.cargarPublicaciones();
      })
      .catch((err: any) => {
        console.error('Error al eliminar la publicación', err);
        this.generalError =
          err?.error?.mensaje ||
          err?.error?.message ||
          'No se pudo eliminar la publicación.';
      })
      .finally(() => {
        this.deletingPostId = null;
      });
  }

  abrirEditar(publicacion: any): void {
    this.publicacionEditar = {
      id: publicacion.id,
      contenido: publicacion.contenido || '',
      tipo: publicacion.tipo || 'COMMUNITY',
      authorId: publicacion.authorId,
      comunidadId: publicacion.comunidadId,
      imageUrl: publicacion.imageUrl
    };

    this.editMode = true;
    this.submittedEdit = false;
    this.limpiarFeedbackEdicion();

    this.selectedEditImageFile = null;
    this.selectedEditImageName = '';
    this.editImagePreview = null;
    this.editImageError = '';
    this.editImageTargetId = publicacion.id;

    this.cdr.detectChanges();
  }

  actualizarPublicacion(publicacion: any): void {
    this.submittedEdit = true;
    this.limpiarFeedbackEdicion();

    const payload = {
      contenido: this.publicacionEditar.contenido?.trim(),
      tipo: this.publicacionEditar.tipo || 'COMMUNITY',
      authorId: this.publicacionEditar.authorId,
      comunidadId: Number(this.publicacionEditar.comunidadId),
      imageUrl: this.editImageTargetId === publicacion.id && this.editImagePreview
        ? this.editImagePreview
        : this.publicacionEditar.imageUrl
    };

    const error = this.validarPayloadPublicacion(payload);
    if (error) {
      this.editError = error;
      return;
    }

    this.updatingPost = true;
    const token = localStorage.getItem('token') || undefined;
    const url = `${this.peticion.urlReal}/api/publicaciones/${publicacion.id}`;

    this.peticion.put(url, payload, token)
      .then(() => {
        this.editSuccess = 'La publicación fue actualizada correctamente.';
        this.generalSuccess = 'Se guardaron los cambios de la publicación.';
        this.cargarPublicaciones();

        setTimeout(() => {
          this.cerrarEditar();
        }, 700);
      })
      .catch((err: any) => {
        console.error('Error al actualizar la publicación', err);
        this.editError =
          err?.error?.mensaje ||
          err?.error?.message ||
          'No se pudo actualizar la publicación.';
      })
      .finally(() => {
        this.updatingPost = false;
        this.cdr.detectChanges();

      });
  }

  openCreate(): void {
    this.createOpen = true;
    this.limpiarFeedbackCrear();
  }

  closeCreate(): void {
    if (this.creatingPost) return;

    this.createOpen = false;
    this.submittedCreate = false;
    this.limpiarFeedbackCrear();

    this.selectedCreateImageFile = null;
    this.selectedCreateImageName = '';
    this.createImagePreview = null;
    this.createImageError = '';

    this.nuevaPublicacion = {
      contenido: '',
      tipo: 'USER',
      authorId: this.usuario.id || null,
      comunidadId: null,
      imageUrl: null
    };
  }

  toggleEditar(pub: any): void {
    if (this.publicacionEditar?.id === pub.id && this.editMode) {
      this.cerrarEditar();
    } else {
      this.abrirEditar(pub);
    }
  }

  cerrarEditar(): void {
    this.editMode = false;
    this.publicacionEditar = {
      id: null,
      contenido: '',
      tipo: 'COMMUNITY',
      authorId: null,
      comunidadId: null,
      imageUrl: null
    };

    this.submittedEdit = false;
    this.limpiarFeedbackEdicion();

    this.selectedEditImageFile = null;
    this.selectedEditImageName = '';
    this.editImagePreview = null;
    this.editImageError = '';
    this.editImageTargetId = null;
  }

  toggleConfirmar(id: number | null): void {
    this.confirmandoId = this.confirmandoId === id ? null : id;
  }

  mostrarMensajeComentarios(): void {
    this.generalError = 'La integración de comentarios aún está pendiente con el backend.';
  }

  darLike(pub: any): void {
    pub.likeado = !pub.likeado;
    pub.likes = pub.likeado ? (pub.likes || 0) + 1 : Math.max((pub.likes || 1) - 1, 0);
    this.cdr.detectChanges();
  }

  trackByPublicacionId(index: number, pub: any): number {
    return pub.id;
  }
  subirImagenPost(postId: number): Promise<void> {
    return new Promise((resolve, reject) => {

      if (!this.selectedCreateImageFile) {
        resolve();
        return;
      }

      const url = `${this.peticion.urlReal}/api/posts/${postId}/images`;
      this.uploadService.UploadFile(this.selectedCreateImageFile, url)
        .subscribe({
          next: (res: any) => {
            console.log('Imagen subida', res);
            resolve();
          },
          error: (err: any) => {
            console.error('Error subiendo imagen', err);
            this.createImageError = 'No se pudo subir la imagen.';
            reject(err);
          }
        });
    });
  }
}