import { Header } from '../header/header';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Footer } from '../footer/footer';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { z } from 'zod';

const publicacionSchema = z.object({
  contenido: z.string().min(1, 'Contenido requerido'),
  tipo: z.string().min(1),
});

@Component({
  selector: 'app-publicacion',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './blog-principal.html',
  styleUrls: ['./blog-principal.css'],
})
export class BlogPrincipal implements OnInit {
  usuario: any = {};
  publicaciones: any[] = [];

  // ── Likes ──────────────────────────────────────
  likedPostIds: Set<number> = new Set();
  likingPostId: number | null = null;

  // ── Loading ────────────────────────────────────
  loadingUsuario: boolean = false;
  loadingPosts: boolean = false;
  creatingPost: boolean = false;
  updatingPost: boolean = false;
  deletingPostId: number | null = null;

  // ── Estados UI ─────────────────────────────────
  createOpen: boolean = false;
  editMode: boolean = false;
  confirmandoId: number | null = null;
  menuAbiertoId: number | null = null;

  submittedCreate: boolean = false;
  submittedEdit: boolean = false;

  // ── Feedback ───────────────────────────────────
  generalError: string = '';
  generalSuccess: string = '';
  createError: string = '';
  createSuccess: string = '';
  editError: string = '';
  editSuccess: string = '';

  // ── Imágenes ───────────────────────────────────
  selectedCreateImageFile: File | null = null;
  selectedCreateImageName: string = '';
  createImagePreview: string | null = null;
  createImageError: string = '';

  selectedEditImageFile: File | null = null;
  selectedEditImageName: string = '';
  editImagePreview: string | null = null;
  editImageError: string = '';
  editImageTargetId: number | null = null;

  // ── Modelos ────────────────────────────────────
  nuevaPublicacion: any = {
    contenido: '',
    tipo: 'USER',
    authorId: null,
    comunidadId: null,
  };

  publicacionEditar: any = {
    id: null,
    contenido: '',
    tipo: 'USER',
    authorId: null,
    comunidadId: null,
    imageUrl: null,
  };

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.buscarUsuario();
    this.cargarPublicaciones();
  }

  // ────────────────────────────────────────────
  // FEEDBACK
  // ────────────────────────────────────────────

  limpiarFeedbackGeneral(): void {
    this.generalError = '';
    this.generalSuccess = '';
  }

  limpiarFeedbackCrear(): void {
    this.createError = '';
    this.createSuccess = '';
  }

  limpiarFeedbackEdicion(): void {
    this.editError = '';
    this.editSuccess = '';
  }

  // ────────────────────────────────────────────
  // USUARIO
  // ────────────────────────────────────────────

  buscarUsuario(): void {
    this.loadingUsuario = true;

    const userStorage = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStorage || !token) {
      this.generalError = 'No se pudo identificar el usuario actual.';
      this.loadingUsuario = false;
      return;
    }

    let user: any;
    try {
      user = JSON.parse(userStorage);
    } catch {
      this.generalError = 'No se pudo leer la sesión actual.';
      this.loadingUsuario = false;
      return;
    }

    const userId = user?.userId ?? user?.id;
    if (!userId) {
      this.generalError = 'El usuario actual no tiene un identificador válido.';
      this.loadingUsuario = false;
      return;
    }

    const url = `${this.peticion.urlReal}/api/users/get/${userId}`;

    this.peticion
      .get(url, token)
      .then((res: any) => {
        this.usuario = res?.data || res || {};
        this.nuevaPublicacion.authorId = this.usuario.id;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.generalError = 'No fue posible cargar el usuario actual.';
      })
      .finally(() => {
        this.loadingUsuario = false;
        this.cdr.detectChanges();
      });
  }

  // ────────────────────────────────────────────
  // PUBLICACIONES: CARGAR
  // ────────────────────────────────────────────

  cargarPublicaciones(): void {
    this.loadingPosts = true;
    const url = `${this.peticion.urlReal}/api/posts/feed/global`;

    this.peticion
      .get(url)
      .then((res: any) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        this.publicaciones = data.slice(0, 20);
        console.log(this.publicaciones);

        // Inicializar likes desde el backend si viene el campo
        this.likedPostIds = new Set(
          this.publicaciones
            .filter((p) => p.likedByCurrentUser === true)
            .map((p) => p.id),
        );

        this.cdr.detectChanges();
      })
      .catch(() => {
        this.generalError = 'No fue posible cargar las publicaciones.';
        this.publicaciones = [];
      })
      .finally(() => {
        this.loadingPosts = false;
        this.cdr.detectChanges();
      });
  }

  // ────────────────────────────────────────────
  // PUBLICACIONES: CREAR
  // ────────────────────────────────────────────

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
    };
  }

  validarArchivoImagen(file: File | null): string {
    if (!file) return '';
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return 'Formato no permitido. Usa JPG, PNG o WEBP.';
    if (file.size > 5 * 1024 * 1024) return 'La imagen no puede superar 5 MB.';
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

  async crearPublicacion(): Promise<void> {
    this.submittedCreate = true;
    this.limpiarFeedbackCrear();

    if (!this.nuevaPublicacion.contenido?.trim()) {
      this.createError = 'El contenido es obligatorio.';
      return;
    }

    this.creatingPost = true;

    try {
      const token = localStorage.getItem('token');

      // Siempre usamos multipart para soportar imagen opcional
      const formData = new FormData();
      formData.append(
        'data',
        JSON.stringify({ contenido: this.nuevaPublicacion.contenido.trim() }),
      );

      if (this.selectedCreateImageFile) {
        formData.append('media', this.selectedCreateImageFile);
      }

      // HttpClient directo para no pisar el Content-Type con el servicio Peticion
      await this.http
        .post(`${this.peticion.urlReal}/api/posts`, formData, {
          headers: new HttpHeaders({
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }),
          withCredentials: true,
        })
        .toPromise();

      this.createSuccess = 'Publicación creada correctamente.';

      // Reset manual (closeCreate fallaría porque creatingPost aún es true)
      this.createOpen = false;
      this.submittedCreate = false;
      this.nuevaPublicacion = {
        contenido: '',
        tipo: 'USER',
        authorId: this.usuario.id || null,
        comunidadId: null,
      };
      this.selectedCreateImageFile = null;
      this.selectedCreateImageName = '';
      this.createImagePreview = null;
      this.createImageError = '';
      this.createError = '';

      this.cargarPublicaciones();
    } catch (err: any) {
      this.createError = err?.error?.message || 'No fue posible crear la publicación.';
    } finally {
      this.creatingPost = false;
      this.cdr.detectChanges();
    }
  }

  // ────────────────────────────────────────────
  // PUBLICACIONES: EDITAR
  // ────────────────────────────────────────────

  toggleEditar(pub: any): void {
    if (this.publicacionEditar?.id === pub.id && this.editMode) {
      this.cerrarEditar();
    } else {
      this.publicacionEditar = {
        id: pub.id,
        contenido: pub.contenido || '',
        tipo: pub.tipo || 'USER',
        authorId: pub.authorId,
        comunidadId: pub.comunidadId,
        imageUrl: pub.imageUrl,
      };
      this.editMode = true;
      this.submittedEdit = false;
      this.limpiarFeedbackEdicion();
      this.selectedEditImageFile = null;
      this.selectedEditImageName = '';
      this.editImagePreview = null;
      this.editImageError = '';
      this.editImageTargetId = pub.id;
      this.cdr.detectChanges();
    }
  }

  cerrarEditar(): void {
    this.editMode = false;
    this.publicacionEditar = { id: null, contenido: '', tipo: 'USER', authorId: null, comunidadId: null, imageUrl: null };
    this.submittedEdit = false;
    this.limpiarFeedbackEdicion();
    this.selectedEditImageFile = null;
    this.selectedEditImageName = '';
    this.editImagePreview = null;
    this.editImageError = '';
    this.editImageTargetId = null;
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

  actualizarPublicacion(publicacion: any): void {
    this.submittedEdit = true;
    this.limpiarFeedbackEdicion();

    const payload = {
      contenido: this.publicacionEditar.contenido?.trim(),
      tipo: this.publicacionEditar.tipo || 'USER',
      authorId: this.publicacionEditar.authorId,
      comunidadId: this.publicacionEditar.comunidadId
        ? Number(this.publicacionEditar.comunidadId)
        : null,
      imageUrl: this.publicacionEditar.imageUrl,
    };

    const resultado = publicacionSchema.safeParse(payload);
    if (!resultado.success) {
      this.editError = resultado.error.errors[0]?.message || 'Datos inválidos.';
      return;
    }

    this.updatingPost = true;
    const token = localStorage.getItem('token') || undefined;
    const url = `${this.peticion.urlReal}/api/posts/${publicacion.id}`; // ✅ URL correcta

    this.peticion
      .put(url, payload, token)
      .then(() => {
        this.editSuccess = 'Publicación actualizada correctamente.';
        this.cargarPublicaciones();
        setTimeout(() => this.cerrarEditar(), 700);
      })
      .catch((err: any) => {
        this.editError =
          err?.error?.mensaje || err?.error?.message || 'No se pudo actualizar la publicación.';
      })
      .finally(() => {
        this.updatingPost = false;
        this.cdr.detectChanges();
      });
  }

  // ────────────────────────────────────────────
  // PUBLICACIONES: ELIMINAR
  // ────────────────────────────────────────────

  toggleConfirmar(id: number | null): void {
    this.confirmandoId = this.confirmandoId === id ? null : id;
  }

  eliminarPublicacion(id: number): void {
    this.deletingPostId = id;
    this.limpiarFeedbackGeneral();

    const token = localStorage.getItem('token') || undefined;
    const url = `${this.peticion.urlReal}/api/posts/${id}`; // ✅ URL correcta

    this.peticion
      .delete(url, {}, token)
      .then(() => {
        this.generalSuccess = 'Publicación eliminada correctamente.';
        this.toggleConfirmar(null);
        this.cargarPublicaciones();
      })
      .catch((err: any) => {
        this.generalError =
          err?.error?.mensaje || err?.error?.message || 'No se pudo eliminar la publicación.';
      })
      .finally(() => {
        this.deletingPostId = null;
        this.cdr.detectChanges();
      });
  }

  // ────────────────────────────────────────────
  // LIKES (conectado al backend con optimistic update)
  // ────────────────────────────────────────────

  darLike(pub: any): void {
    if (this.likingPostId === pub.id) return;

    const token = localStorage.getItem('token') || undefined;
    const yaLikeado = this.likedPostIds.has(pub.id);

    // Optimistic update
    if (yaLikeado) {
      this.likedPostIds.delete(pub.id);
      pub.likes = Math.max((pub.likes || 1) - 1, 0);
    } else {
      this.likedPostIds.add(pub.id);
      pub.likes = (pub.likes || 0) + 1;
    }
    this.cdr.detectChanges();

    this.likingPostId = pub.id;

    const url = `${this.peticion.urlReal}/api/posts/${pub.id}/like`;
    const peticion = yaLikeado
      ? this.peticion.delete(url, {}, token)
      : this.peticion.post(url, {}, token);

    peticion
      .then((res: any) => {
        if (res?.likes !== undefined) {
          pub.likes = res.likes;
          this.cdr.detectChanges();
        }
      })
      .catch(() => {
        // Revertir si falló
        if (yaLikeado) {
          this.likedPostIds.add(pub.id);
          pub.likes = (pub.likes || 0) + 1;
        } else {
          this.likedPostIds.delete(pub.id);
          pub.likes = Math.max((pub.likes || 1) - 1, 0);
        }
        this.generalError = 'No fue posible registrar el like.';
        this.cdr.detectChanges();
      })
      .finally(() => {
        this.likingPostId = null;
        this.cdr.detectChanges();
      });
  }

  // ────────────────────────────────────────────
  // MENÚ DESPLEGABLE
  // ────────────────────────────────────────────

  toggleMenu(id: number): void {
    this.menuAbiertoId = this.menuAbiertoId === id ? null : id;
  }

  // ────────────────────────────────────────────
  // UTILIDADES
  // ────────────────────────────────────────────

  trackByPublicacionId(index: number, pub: any): number {
    return pub.id;
  }
}