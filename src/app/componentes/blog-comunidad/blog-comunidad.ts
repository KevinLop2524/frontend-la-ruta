import { Header } from '../header/header';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Footer } from '../footer/footer';
import { z } from 'zod';

const publicacionSchema = z.object({
  contenido: z.string().min(1, 'Contenido requerido'),
  tipo: z.string().min(1)
});

@Component({
  selector: 'app-comunidad-vista',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './blog-comunidad.html',
  styleUrls: ['./blog-comunidad.css']
})
export class BlogComunidad implements OnInit {

  // ── Estado general ──────────────────────────────
  comunidadId: number | null = null;
  comunidad: any = null;
  usuario: any = {};
  rol: string[] = [];
  esMiembro: boolean = false;
  totalMiembros: number = 0;

  // ── Tabs ──────────────────────────────────────
  tabActivo: string = 'feed';

  // ── Loading flags ──────────────────────────────
  loadingComunidad: boolean = false;
  loadingPosts: boolean = false;
  loadingMiembros: boolean = false;
  loadingServicios: boolean = false;
  creatingPost: boolean = false;
  updatingPost: boolean = false;
  deletingPostId: number | null = null;
  joiningCommunity: boolean = false;
  leavingCommunity: boolean = false;
  savingComunidad: boolean = false;
  deletingComunidad: boolean = false;

  // ── Datos ──────────────────────────────────────
  publicaciones: any[] = [];
  miembros: any[] = [];
  miembrosFiltrados: any[] = [];
  servicios: any[] = [];

  // ── Feed: crear post ──────────────────────────
  createOpen: boolean = false;
  submittedCreate: boolean = false;
  createError: string = '';
  createSuccess: string = '';
  nuevaPublicacion: any = {
    contenido: '',
    tipo: 'COMMUNITY',
    authorId: null,
    comunidadId: null,
    imageUrl: null
  };
  selectedImageFile: File | null = null;
  selectedImageName: string = '';
  imagePreview: string | null = null;
  imageError: string = '';

  // ── Feed: editar post ─────────────────────────
  editMode: boolean = false;
  confirmandoId: number | null = null;
  submittedEdit: boolean = false;
  editError: string = '';
  editSuccess: string = '';
  publicacionEditar: any = {
    id: null,
    contenido: '',
    tipo: 'COMMUNITY',
    authorId: null,
    comunidadId: null,
    imageUrl: null
  };

  // ── Miembros ──────────────────────────────────
  memberSearch: string = '';

  // ── Servicios (placeholder data) ─────────────
  // Cuando el backend esté disponible, reemplaza esto con la llamada real

  // ── Info / editar comunidad ───────────────────
  comunidadEditar: any = { name: '', description: '', category: '' };
  editComunidadError: string = '';
  editComunidadSuccess: string = '';

  // ── Alerts globales ───────────────────────────
  generalError: string = '';
  generalSuccess: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private peticion: Peticion,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Leer roles del localStorage
    const rolesGuardados = localStorage.getItem('roles');
    const roleUnico = localStorage.getItem('role');
    if (rolesGuardados) {
      try { this.rol = JSON.parse(rolesGuardados); } catch { this.rol = []; }
    } else if (roleUnico) {
      this.rol = [roleUnico];
    }

    // Obtener ID de comunidad desde la URL
    this.route.params.subscribe(params => {
      this.comunidadId = Number(params['id']);
      console.log(this.comunidadId);
      this.inicializar();
    });
  }

  inicializar(): void {
    this.buscarUsuario();
    this.cargarComunidad();
    this.cargarPublicaciones();
    this.cargarMiembros();
    this.cargarServicios();
  }

  // ────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────

  esAdmin(): boolean {
    return this.rol.includes('ROLE_ADMIN') || this.rol.includes('ADMIN');
  }

  traducirCategoria(categoria: string): string {
    switch (categoria) {
      case 'NUTRITION': return 'Nutrición';
      case 'FITNESS': return 'Fitness';
      case 'PERSONAL_DEVELOPMENT': return 'Desarrollo personal';
      default: return categoria || '';
    }
  }

  setTab(tab: string): void {
    this.tabActivo = tab;
    this.limpiarFeedbackGeneral();
  }

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

  trackById(index: number, item: any): number {
    return item.id;
  }

  // ────────────────────────────────────────────
  // CARGA DE DATOS
  // ────────────────────────────────────────────

  buscarUsuario(): void {
    const userStorage = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStorage || !token) return;

    let user;
    try { user = JSON.parse(userStorage); } catch { return; }

    const userId = user?.id || user?.userId;
    if (!userId) return;

    const url = `${this.peticion.urlReal}/api/users/get/${userId}`;
    this.peticion.get(url, token)
      .then((res: any) => {
        this.usuario = res?.data || res || {};
        this.nuevaPublicacion.authorId = this.usuario.id;
        this.verificarMembresia();
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error al cargar usuario', err);
      });
  }

  cargarComunidad(): void {
    this.loadingComunidad = true;
    const url = `${this.peticion.urlReal}/api/communities/get/${this.comunidadId}`;

    this.peticion.get(url)
      .then((res: any) => {
        this.comunidad = res?.data || res || null;
        if (this.comunidad) {
          this.comunidadEditar = {
            name: this.comunidad.name,
            description: this.comunidad.description,
            category: this.comunidad.category
          };
        }
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error(err);
        console.error('Error al cargar comunidad', err);
        this.generalError = 'No fue posible cargar la comunidad.';
      })
      .finally(() => {
        this.loadingComunidad = false;
        this.cdr.detectChanges();
      });
  }

  cargarPublicaciones(): void {
    this.loadingPosts = true;
    const url = `${this.peticion.urlReal}/api/posts/community/${this.comunidadId}`;

    this.peticion.get(url)
      .then((res: any) => {
        this.publicaciones = Array.isArray(res) ? res : (res?.data || []);
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error al cargar publicaciones', err);
        this.publicaciones = [];
      })
      .finally(() => {
        this.loadingPosts = false;
        this.cdr.detectChanges();
      });
  }

  cargarMiembros(): void {
    this.loadingMiembros = true;
    const url = `${this.peticion.urlReal}/api/communities/${this.comunidadId}/members`;

    this.peticion.get(url)
      .then((res: any) => {
        this.miembros = Array.isArray(res) ? res : (res?.data || []);
        this.totalMiembros = this.miembros.length;
        this.miembrosFiltrados = [...this.miembros];
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error al cargar miembros', err);
        this.miembros = [];
        this.miembrosFiltrados = [];
      })
      .finally(() => {
        this.loadingMiembros = false;
        this.cdr.detectChanges();
      });
  }

  cargarServicios(): void {
    this.loadingServicios = true;
    const url = `${this.peticion.urlReal}/api/services/${this.comunidadId}/active`;

    this.peticion.get(url)
      .then((res: any) => {
        this.servicios = Array.isArray(res) ? res : (res?.data || []);
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error al cargar servicios', err);
        // Si el endpoint aún no existe, dejamos array vacío silenciosamente
        this.servicios = [];
      })
      .finally(() => {
        this.loadingServicios = false;
        this.cdr.detectChanges();
      });
  }

  // ────────────────────────────────────────────
  // MEMBRESÍA
  // ────────────────────────────────────────────

  verificarMembresia(): void {
    if (!this.usuario?.id || !this.comunidadId) return;

    const url = `${this.peticion.urlReal}/api/communities/${this.comunidadId}/is-member/${this.usuario.id}`;
    this.peticion.get(url)
      .then((res: any) => {
        this.esMiembro = res?.isMember === true;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.esMiembro = false;
      });
  }

  unirse(): void {
    if (!this.usuario?.id) {
      this.generalError = 'No se pudo identificar el usuario actual.';
      return;
    }

    this.joiningCommunity = true;
    this.limpiarFeedbackGeneral();

    const url = `${this.peticion.urlReal}/api/communities/${this.comunidadId}/join`;
    this.peticion.post(url, { userId: this.usuario.id })
      .then(() => {
        this.esMiembro = true;
        this.generalSuccess = '¡Te uniste a la comunidad!';
        this.cargarMiembros();
      })
      .catch((err: any) => {
        this.generalError = err?.error?.message || 'No fue posible unirte a la comunidad.';
      })
      .finally(() => {
        this.joiningCommunity = false;
        this.cdr.detectChanges();
      });
  }

  salirComunidad(): void {
    if (!this.usuario?.id) return;

    this.leavingCommunity = true;
    this.limpiarFeedbackGeneral();

    const url = `${this.peticion.urlReal}/api/communities/${this.comunidadId}/leave`;
    this.peticion.post(url, { userId: this.usuario.id })
      .then(() => {
        this.generalSuccess = 'Saliste de la comunidad.';
        this.esMiembro = false;
        this.cargarMiembros();
      })
      .catch((err: any) => {
        this.generalError = err?.error?.message || 'No fue posible salir de la comunidad.';
      })
      .finally(() => {
        this.leavingCommunity = false;
        this.cdr.detectChanges();
      });
  }

  expulsarMiembro(miembro: any): void {
    if (!this.esAdmin()) return;

    const token = localStorage.getItem('token') || undefined;
    const url = `${this.peticion.urlReal}/api/communities/${this.comunidadId}/remove-member/${miembro.id}`;

    this.peticion.delete(url, token ? { token } : {})
      .then(() => {
        this.generalSuccess = `${miembro.username} fue expulsado de la comunidad.`;
        this.cargarMiembros();
      })
      .catch((err: any) => {
        this.generalError = err?.error?.message || 'No fue posible expulsar al miembro.';
      })
      .finally(() => {
        this.cdr.detectChanges();
      });
  }

  filtrarMiembros(): void {
    const termino = this.memberSearch.trim().toLowerCase();
    this.miembrosFiltrados = this.miembros.filter(m =>
      !termino ||
      m.username?.toLowerCase().includes(termino) ||
      m.email?.toLowerCase().includes(termino)
    );
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
    this.selectedImageFile = null;
    this.selectedImageName = '';
    this.imagePreview = null;
    this.imageError = '';
    this.nuevaPublicacion = {
      contenido: '',
      tipo: 'COMMUNITY',
      authorId: this.usuario.id || null,
      comunidadId: this.comunidadId,
      imageUrl: null
    };
  }

  validarArchivoImagen(file: File | null): string {
    if (!file) return '';
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) return 'Formato no permitido. Usa JPG, PNG o WEBP.';
    if (file.size > maxSizeBytes) return 'La imagen no puede superar 5 MB.';
    return '';
  }

  onImageSelected(event: Event): void {
    this.imageError = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    const error = this.validarArchivoImagen(file);

    if (error) {
      this.imageError = error;
      this.selectedImageFile = null;
      this.selectedImageName = '';
      this.imagePreview = null;
      input.value = '';
      return;
    }

    if (!file) return;

    this.selectedImageFile = file;
    this.selectedImageName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
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

    if (!this.comunidadId) {
      this.createError = 'No se pudo identificar la comunidad.';
      return;
    }

    this.creatingPost = true;

    try {
      const token = localStorage.getItem('token') || undefined;

      const url = `${this.peticion.urlReal}/api/posts/communities/${this.comunidadId}`;

      const formData = new FormData();

      formData.append(
        'data',
        new Blob(
          [JSON.stringify({
            contenido: this.nuevaPublicacion.contenido.trim()
          })],
          { type: 'application/json' }
        )
      );

      if (this.selectedImageFile) {
        formData.append('media', this.selectedImageFile);
      }
      const postCreado: any = await this.peticion.post(url, formData, token);

      this.createSuccess = 'Publicación creada correctamente.';
      this.cargarPublicaciones();
      this.closeCreate();

    } catch (err: any) {
      console.error("ERROR BACKEND:", err);
      this.createError =
        err?.error?.message ||
        'No fue posible crear la publicación.';
    } finally {
      this.creatingPost = false;
      this.cdr.detectChanges();
    }
  }

  // ────────────────────────────────────────────
  // PUBLICACIONES: EDITAR / ELIMINAR
  // ────────────────────────────────────────────

  toggleEditar(pub: any): void {
    if (this.publicacionEditar?.id === pub.id && this.editMode) {
      this.cerrarEditar();
    } else {
      this.publicacionEditar = {
        id: pub.id,
        contenido: pub.contenido || '',
        tipo: pub.tipo || 'COMMUNITY',
        authorId: pub.authorId,
        comunidadId: pub.comunidadId,
        imageUrl: pub.imageUrl
      };
      this.editMode = true;
      this.submittedEdit = false;
      this.limpiarFeedbackEdicion();
      this.cdr.detectChanges();
    }
  }

  cerrarEditar(): void {
    this.editMode = false;
    this.publicacionEditar = { id: null, contenido: '', tipo: 'COMMUNITY', authorId: null, comunidadId: null, imageUrl: null };
    this.submittedEdit = false;
    this.limpiarFeedbackEdicion();
  }

  actualizarPublicacion(publicacion: any): void {
    this.submittedEdit = true;
    this.limpiarFeedbackEdicion();

    const payload = {
      contenido: this.publicacionEditar.contenido?.trim(),
      tipo: this.publicacionEditar.tipo || 'COMMUNITY',
      authorId: this.publicacionEditar.authorId,
      comunidadId: Number(this.publicacionEditar.comunidadId),
      imageUrl: this.publicacionEditar.imageUrl
    };

    const resultado = publicacionSchema.safeParse(payload);
    if (!resultado.success) {
      this.editError = resultado.error.errors[0]?.message || 'Datos inválidos.';
      return;
    }

    this.updatingPost = true;
    const token = localStorage.getItem('token') || undefined;
    const url = `${this.peticion.urlReal}/api/publicaciones/${publicacion.id}`;

    this.peticion.put(url, payload, token)
      .then(() => {
        this.editSuccess = 'Publicación actualizada correctamente.';
        this.cargarPublicaciones();
        setTimeout(() => { this.cerrarEditar(); }, 700);
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

  toggleConfirmar(id: number | null): void {
    this.confirmandoId = this.confirmandoId === id ? null : id;
  }

  eliminarPublicacion(id: number): void {
    this.deletingPostId = id;
    const token = localStorage.getItem('token') || undefined;
    const url = `${this.peticion.urlReal}/api/publicaciones/${id}`;

    this.peticion.delete(url, token ? { token } : {})
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

  darLike(pub: any): void {
    pub.likeado = !pub.likeado;
    pub.likes = pub.likeado ? (pub.likes || 0) + 1 : Math.max((pub.likes || 1) - 1, 0);
    this.cdr.detectChanges();
  }

  mostrarMensajeComentarios(): void {
    this.generalError = 'La integración de comentarios está pendiente con el backend.';
  }

  // ────────────────────────────────────────────
  // COMUNIDAD: EDITAR / ELIMINAR (Admin)
  // ────────────────────────────────────────────

  actualizarComunidad(): void {
    if (!this.comunidadEditar.name?.trim() || !this.comunidadEditar.description?.trim() || !this.comunidadEditar.category) {
      this.editComunidadError = 'Todos los campos son obligatorios.';
      return;
    }

    this.savingComunidad = true;
    this.editComunidadError = '';
    this.editComunidadSuccess = '';

    const token = localStorage.getItem('token') || undefined;
    const url = `${this.peticion.urlReal}/api/communities/update/${this.comunidadId}`;

    const payload = {
      name: this.comunidadEditar.name.trim(),
      description: this.comunidadEditar.description.trim(),
      category: this.comunidadEditar.category
    };

    this.peticion.patch(url, payload, token)
      .then(() => {
        this.editComunidadSuccess = 'Comunidad actualizada correctamente.';
        this.cargarComunidad();
      })
      .catch((err: any) => {
        this.editComunidadError = err?.error?.message || 'No fue posible actualizar la comunidad.';
      })
      .finally(() => {
        this.savingComunidad = false;
        this.cdr.detectChanges();
      });
  }

  confirmarEliminarComunidad(): void {
    if (!confirm('¿Seguro que deseas eliminar esta comunidad? Esta acción no se puede deshacer.')) return;

    this.deletingComunidad = true;
    this.editComunidadError = '';
    const url = `${this.peticion.urlReal}/api/communities/delete/${this.comunidadId}`;

    this.peticion.delete(url, {})
      .then(() => {
        this.generalSuccess = 'La comunidad fue eliminada correctamente.';
        setTimeout(() => {
          this.router.navigate(['/comunidades']);
        }, 1000);
      })
      .catch((err: any) => {
        this.editComunidadError = err?.error?.message || 'No se pudo eliminar la comunidad.';
      })
      .finally(() => {
        this.deletingComunidad = false;
        this.cdr.detectChanges();
      });
  }

  // ────────────────────────────────────────────
  // SERVICIOS: placeholder para cuando exista el backend
  // ────────────────────────────────────────────

  openCrearServicio(): void {
    this.generalError = 'La gestión de servicios estará disponible próximamente.';
  }
}