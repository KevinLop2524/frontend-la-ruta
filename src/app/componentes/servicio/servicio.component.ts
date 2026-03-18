import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Peticion } from '../../servicios/peticion';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Footer } from '../footer/footer';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { th } from 'zod/v4/locales';

@Component({
  selector: 'app-servicio',
  imports: [CommonModule, Header, Footer, FormsModule, RouterLink],
  templateUrl: './servicio.component.html',
  styleUrl: './servicio.component.css'
})
export class ServicioComponent implements OnInit {
  servicios: any[] = [];
  idComunidad: number = 0;
  usuario: any = {};
  comunidad: any = {};

  loadingServicios: boolean = false;
  loadingComunidad: boolean = false;
  loadingUsuario: boolean = false;
  creatingServicio: boolean = false;

  submitted: boolean = false;

  servicesError: string = '';
  servicesSuccess: string = '';
  formError: string = '';
  formSuccess: string = '';

  ServicioCrear: any = {
    titulo: '',
    descripcion: '',
    categoria: '',
    estado: 'activo',
    fecha: '',
    id_creador: '',
    comunidad_id: ''
  };

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id || isNaN(+id)) {
      this.servicesError = 'No se encontró una comunidad válida.';
      return;
    }

    this.idComunidad = +id;
    this.ServicioCrear.comunidad_id = this.idComunidad;

    this.cargarServicios();
    this.buscarUsuario();
    this.buscarComunidad();
  }

  limpiarFeedbackFormulario(): void {
    this.formError = '';
    this.formSuccess = '';
  }

  limpiarFeedbackServicios(): void {
    this.servicesError = '';
    this.servicesSuccess = '';
  }

  buscarUsuario(): void {
    this.loadingUsuario = true;

    const userStorage = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStorage || !token) {
      this.loadingUsuario = false;
      this.formError = 'No se pudo identificar el usuario actual.';
      this.cdr.detectChanges();
      return;
    }

    let user;

    try {
      user = JSON.parse(userStorage);
    } catch (error) {
      console.error('Error parseando user del localStorage', error);
      this.loadingUsuario = false;
      this.formError = 'No se pudo leer la sesión actual.';
      return;
    }

    if (!user?.id) {
      this.loadingUsuario = false;
      this.formError = 'El usuario actual no tiene un identificador válido.';
      return;
    }

    const url = `${this.peticion.urlReal}/api/users/get/${user.id}`;

    this.peticion.get(url, token)
      .then((res: any) => {
        this.usuario = res?.data || res;
        this.ServicioCrear.id_creador = this.usuario.id;
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error al encontrar usuario', err);
        this.formError = 'No fue posible cargar el usuario actual.';
      })
      .finally(() => {
        this.loadingUsuario = false;
        this.cdr.detectChanges();
      });
  }

  buscarComunidad(): void {
    this.loadingComunidad = true;

    const token = localStorage.getItem('token') || undefined;
    const url = `${this.peticion.urlReal}/api/communities/get/${this.idComunidad}`;

    this.peticion.get(url, token)
      .then((res: any) => {
        this.comunidad = res?.data || res;
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error al obtener la comunidad', err);
        this.servicesError = 'No fue posible cargar la información de la comunidad.';
      })
      .finally(() => {
        this.loadingComunidad = false;
        this.cdr.detectChanges();
      });
  }

  cargarServicios(): void {
    this.loadingServicios = true;
    this.limpiarFeedbackServicios();

    const url = `${this.peticion.urlReal}/api/services/community/${this.idComunidad}/all?userId=${this.idComunidad}`;

    this.peticion.get(url)
      .then((res: any) => {
        this.servicios = Array.isArray(res) ? res : [];
        console.log(this.servicios);
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('Error al obtener servicios', err);
        this.servicesError = 'No fue posible cargar los servicios.';
        this.servicios = [];
      })
      .finally(() => {
        this.loadingServicios = false;
        this.cdr.detectChanges();
      });
  }

  validarFormularioServicio(): boolean {
    this.submitted = true;
    this.limpiarFeedbackFormulario();

    const titulo = this.ServicioCrear.titulo?.trim();
    const descripcion = this.ServicioCrear.descripcion?.trim();
    const categoria = this.ServicioCrear.categoria;

    if (!titulo) {
      this.formError = 'El nombre del servicio es obligatorio.';
      return false;
    }

    if (titulo.length < 4) {
      this.formError = 'El nombre del servicio debe tener al menos 4 caracteres.';
      return false;
    }

    if (titulo.length > 80) {
      this.formError = 'El nombre del servicio no puede superar 80 caracteres.';
      return false;
    }

    if (!descripcion) {
      this.formError = 'La descripción es obligatoria.';
      return false;
    }

    if (descripcion.length < 10) {
      this.formError = 'La descripción debe tener al menos 10 caracteres.';
      return false;
    }

    if (descripcion.length > 500) {
      this.formError = 'La descripción no puede superar 500 caracteres.';
      return false;
    }

    if (!categoria) {
      this.formError = 'Debes seleccionar una categoría.';
      return false;
    }

    if (!this.usuario?.id) {
      this.formError = 'Aún no se ha cargado el usuario actual.';
      return false;
    }

    return true;
  }

  crearServicio(): void {
    if (!this.validarFormularioServicio()) {
      return;
    }

    this.creatingServicio = true;
    this.limpiarFeedbackFormulario();

    const token = localStorage.getItem('token') || undefined;

    const payload = {
      nombre: this.ServicioCrear.titulo.trim(),
      descripcion: this.ServicioCrear.descripcion.trim(),
      estado: 'activo',
      categoria: this.ServicioCrear.categoria,
      idCreador: this.usuario.id,
      comunidad: { id: this.idComunidad }
    };

    const url = `${this.peticion.urlReal}/api/servicio/crear`;

    this.peticion.post(url, payload, token)
      .then((res: any) => {
        this.formSuccess = res?.mensaje || 'Servicio publicado correctamente.';
        this.servicesSuccess = 'Se agregó un nuevo servicio a la comunidad.';

        this.ServicioCrear = {
          titulo: '',
          descripcion: '',
          categoria: '',
          estado: 'activo',
          fecha: '',
          id_creador: this.usuario.id,
          comunidad_id: this.idComunidad
        };

        this.submitted = false;
        this.cargarServicios();
      })
      .catch((err: any) => {
        console.error('Error al crear servicio', err);
        this.formError =
          err?.error?.mensaje ||
          err?.error?.message ||
          'No fue posible crear el servicio.';
      })
      .finally(() => {
        this.creatingServicio = false;
        this.cdr.detectChanges();
      });
  }

  obtenerNombreComunidad(): string {
    return this.comunidad?.name || this.comunidad?.nombre || 'Comunidad';
  }

  obtenerDescripcionComunidad(): string {
    return this.comunidad?.description || this.comunidad?.descripcion || 'Sin descripción disponible.';
  }

  obtenerCategoriaComunidad(): string {
    return this.comunidad?.category || this.comunidad?.tematica || '';
  }

  obtenerTipoComunidad(): string {
    return this.comunidad?.type || this.comunidad?.tipo || '';
  }

  traducirCategoriaServicio(categoria: string): string {
    switch (categoria) {
      case 'NUTRICION':
        return 'Nutrición';
      case 'ENTRENAMIENTO':
        return 'Entrenamiento';
      case 'SALUD_MENTAL':
        return 'Salud mental';
      case 'BIENESTAR':
        return 'Bienestar general';
      case 'PRODUCTIVIDAD':
        return 'Productividad';
      case 'DESARROLLO_PERSONAL':
        return 'Desarrollo personal';
      case 'MOTIVACION':
        return 'Motivación';
      default:
        return categoria || 'General';
    }
  }

  obtenerIconoCategoria(categoria: string): string {
    switch (categoria) {
      case 'NUTRICION':
        return '🥗';
      case 'ENTRENAMIENTO':
        return '🏋️';
      case 'SALUD_MENTAL':
        return '🧠';
      case 'BIENESTAR':
        return '✨';
      case 'PRODUCTIVIDAD':
        return '📈';
      case 'DESARROLLO_PERSONAL':
        return '🚀';
      case 'MOTIVACION':
        return '🔥';
      default:
        return '📌';
    }
  }

  trackByServicioId(index: number, servicio: any): number {
    return servicio.id;
  }
}