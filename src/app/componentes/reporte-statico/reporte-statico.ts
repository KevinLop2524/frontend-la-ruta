import { ChangeDetectorRef, Component, HostListener, OnInit } from "@angular/core";
import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { Peticion } from "../../servicios/peticion";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-reporte-statico",
  standalone: true,
  imports: [Header, Footer, CommonModule, FormsModule],
  templateUrl: "./reporte-statico.html",
  styleUrl: "./reporte-statico.css",
})
export class ReporteStatico implements OnInit {
  usuarios: any[] = [];
  tokenLog: string = "";

  cargando       = false;
  descargandoPdf = false;
  errorMessage   = "";
  successMessage = "";

  filtros = this.obtenerFiltrosIniciales();

  // ── Estado del menú desplegable ──────────────────────────────
  menuAbiertoPara: number | null = null;

  // ── Estado del panel de confirmación inline ──────────────────
  // accionActiva: 'eliminar' | 'activar' | 'rol' | null
  accionExpandidaId: number | null = null;
  accionActiva: string | null = null;
  procesandoId: number | null = null;

  // Para el cambio de rol: almacena el rol seleccionado en el select inline
  rolNuevo: string = "";

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.tokenLog = localStorage.getItem("token") || "";
    this.aplicarFiltros();
  }

  // ── Cierra el dropdown al hacer clic fuera ───────────────────
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest(".rs-dropdown")) {
      this.menuAbiertoPara = null;
      this.cdr.detectChanges();
    }
  }

  // ── Menú desplegable ─────────────────────────────────────────
  toggleMenu(id: number): void {
    this.menuAbiertoPara = this.menuAbiertoPara === id ? null : id;
  }

  // ── Panel de confirmación inline ─────────────────────────────
  abrirAccion(usuario: any, accion: string): void {
    this.menuAbiertoPara    = null;
    this.accionExpandidaId  = usuario.id;
    this.accionActiva       = accion;
    this.errorMessage       = "";
    this.successMessage     = "";
    // Pre-selecciona el rol actual del usuario al abrir el selector
    if (accion === "rol") {
      this.rolNuevo = usuario.role || "CLIENT";
    }
  }

  cerrarAccion(): void {
    this.accionExpandidaId = null;
    this.accionActiva      = null;
    this.rolNuevo          = "";
  }

  // ── Acciones ─────────────────────────────────────────────────

  async confirmarEliminacion(usuario: any): Promise<void> {
    this.procesandoId  = usuario.id;
    this.errorMessage  = "";
    this.successMessage = "";

    try {
      const url = `${this.peticion.urlReal}/api/users/delete/${usuario.id}`;
      await this.peticion.delete(url, {}, this.tokenLog);

      this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
      this.successMessage = `Usuario "${usuario.fullName}" eliminado correctamente.`;
      this.cerrarAccion();
    } catch (err: any) {
      console.error(err);
      this.errorMessage = err?.error?.message || "No se pudo eliminar el usuario.";
      this.cerrarAccion();
    } finally {
      this.procesandoId = null;
      this.cdr.detectChanges();
    }
  }

  async confirmarActivacion(usuario: any): Promise<void> {
    this.procesandoId   = usuario.id;
    this.errorMessage   = "";
    this.successMessage = "";

    try {
      const url = `${this.peticion.urlReal}/api/users/update/${usuario.id}`;
      await this.peticion.patch(url, { active: true }, this.tokenLog);

      // Actualiza el estado localmente sin recargar toda la lista
      const idx = this.usuarios.findIndex(u => u.id === usuario.id);
      if (idx !== -1) this.usuarios[idx].active = true;

      this.successMessage = `Usuario "${usuario.fullName}" activado correctamente.`;
      this.cerrarAccion();
    } catch (err: any) {
      console.error(err);
      console.log(err);  
      this.errorMessage = err?.error?.message || "No se pudo activar el usuario.";
      this.cerrarAccion();
    } finally {
      this.procesandoId = null;
      this.cdr.detectChanges();
    }
  }

  async confirmarCambioRol(usuario: any): Promise<void> {
    if (!this.rolNuevo || this.rolNuevo === usuario.role) {
      this.cerrarAccion();
      return;
    }

    this.procesandoId   = usuario.id;
    this.errorMessage   = "";
    this.successMessage = "";

    try {
      const url = `${this.peticion.urlReal}/api/users/update/${usuario.id}`;
      await this.peticion.patch(url, { role: this.rolNuevo }, this.tokenLog);

      // Actualiza el rol localmente
      const idx = this.usuarios.findIndex(u => u.id === usuario.id);
      if (idx !== -1) this.usuarios[idx].role = this.rolNuevo;

      this.successMessage = `Rol de "${usuario.fullName}" cambiado a ${this.rolNuevo}.`;
      this.cerrarAccion();
    } catch (err: any) {
      console.error(err);
      this.errorMessage = err?.error?.message || "No se pudo cambiar el rol.";
      this.cerrarAccion();
    } finally {
      this.procesandoId = null;
      this.cdr.detectChanges();
    }
  }

  // ── Filtros ──────────────────────────────────────────────────

  obtenerFiltrosIniciales() {
    return {
      name: "",
      email: "",
      role: "",
      active: "",
      fechaInicioRegistro: "",
      fechaFinRegistro: "",
    };
  }

  construirPayloadFiltros() {
    return {
      name:                this.filtros.name?.trim()  || null,
      email:               this.filtros.email?.trim() || null,
      role:                this.filtros.role           || null,
      active:              this.filtros.active === ""  ? null : this.filtros.active === "true",
      fechaInicioRegistro: this.filtros.fechaInicioRegistro || null,
      fechaFinRegistro:    this.filtros.fechaFinRegistro    || null,
    };
  }

  async aplicarFiltros(): Promise<void> {
    this.cargando      = true;
    this.errorMessage  = "";
    this.successMessage = "";
    this.cerrarAccion();

    try {
      const url     = `${this.peticion.urlReal}/api/reportes/usuarios/lista`;
      const payload = this.construirPayloadFiltros();
      const res: any = await this.peticion.post(url, payload, this.tokenLog);

      this.usuarios = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)     ? res.data
        : Array.isArray(res?.usuarios) ? res.usuarios
        : [];
    } catch (err: any) {
      console.error(err);
      this.usuarios     = [];
      this.errorMessage = err?.error?.message || "Error al obtener los usuarios.";
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  limpiarFiltros(): void {
    this.filtros = this.obtenerFiltrosIniciales();
    this.aplicarFiltros();
  }

  // ── Reporte PDF ──────────────────────────────────────────────

  async reporte(): Promise<void> {
    this.descargandoPdf = true;
    this.errorMessage   = "";

    try {
      const blob = await this.peticion.downloadPdfPost(
        `${this.peticion.urlReal}/api/reportes/usuarios/pdf`,
        this.construirPayloadFiltros(),
        this.tokenLog,
      );

      const url = window.URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = "usuarios_reporte.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      this.errorMessage = err?.error?.message || "No se pudo generar el reporte PDF.";
    } finally {
      this.descargandoPdf = false;
      this.cdr.detectChanges();
    }
  }

  async reporteComunidades(): Promise<void> {
  this.descargandoPdf = true;
  this.errorMessage = '';

  try {
    const blob = await this.peticion.downloadPdfGet(
      `${this.peticion.urlReal}/api/admin/reports/communities`,
      this.tokenLog
    );

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_comunidades.pdf';
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('Error al descargar reporte de comunidades', err);
    this.errorMessage =
      err?.error?.message ||
      err?.message ||
      'No se pudo generar el reporte PDF.';
  } finally {
    this.descargandoPdf = false;
    this.cdr.detectChanges();
  }
}

  // ── Ver usuario ──────────────────────────────────────────────

  verUsuario(usuario: any): void {
    console.log("Ver usuario:", usuario);
    // Aquí puedes abrir un modal, navegar a una ruta, etc.
  }

  // Mantenido por compatibilidad con llamadas previas
  async eliminarUsuario(usuario: any): Promise<void> {
    this.abrirAccion(usuario, "eliminar");
  }

  trackByUsuario(index: number, item: any): any {
    return item?.id || item?.email || index;
  }
}