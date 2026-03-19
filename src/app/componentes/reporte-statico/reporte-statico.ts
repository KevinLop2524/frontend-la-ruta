import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
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

  cargando = false;
  descargandoPdf = false;
  errorMessage = "";

  filtros = this.obtenerFiltrosIniciales();

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.tokenLog = localStorage.getItem("token") || "";
    this.aplicarFiltros();
  }

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
      name: this.filtros.name?.trim() || null,
      email: this.filtros.email?.trim() || null,
      role: this.filtros.role || null,
      active:
        this.filtros.active === ""
          ? null
          : this.filtros.active === "true",
      fechaInicioRegistro: this.filtros.fechaInicioRegistro || null,
      fechaFinRegistro: this.filtros.fechaFinRegistro || null,
    };
  }

  async aplicarFiltros(): Promise<void> {
    this.cargando = true;
    this.errorMessage = "";

    try {
      const url = `${this.peticion.urlReal}/api/reportes/usuarios/lista`;
      const payload = this.construirPayloadFiltros();

      const res: any = await this.peticion.post(url, payload, this.tokenLog);

      if (Array.isArray(res)) {
        this.usuarios = res;
      } else if (Array.isArray(res?.data)) {
        this.usuarios = res.data;
      } else if (Array.isArray(res?.usuarios)) {
        this.usuarios = res.usuarios;
      } else {
        this.usuarios = [];
      }
    } catch (err: any) {
      console.error(err);
      this.usuarios = [];
      this.errorMessage =
        err?.error?.message || "Error al obtener los usuarios.";
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  limpiarFiltros(): void {
    this.filtros = this.obtenerFiltrosIniciales();
    this.aplicarFiltros();
  }

  async reporte(): Promise<void> {
    this.descargandoPdf = true;
    this.errorMessage = "";

    try {
      const payload = this.construirPayloadFiltros();

      const blob = await this.peticion.downloadPdfPost(
        `${this.peticion.urlReal}/api/reportes/usuarios/pdf`,
        payload,
        this.tokenLog
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "usuarios_reporte.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      this.errorMessage =
        err?.error?.message || "No se pudo generar el reporte PDF.";
    } finally {
      this.descargandoPdf = false;
      this.cdr.detectChanges();
    }
  }

  verUsuario(usuario: any): void {
    console.log("Ver usuario:", usuario);
  }

  async eliminarUsuario(usuario: any): Promise<void> {
    const confirmacion = confirm(
      `¿Seguro que deseas eliminar a ${usuario.fullName}?`,
    );

    if (!confirmacion) return;

    try {
      const url = `${this.peticion.urlReal}/api/users/delete/${usuario.id}`;

      await this.peticion.delete(url, {}, this.tokenLog);

      this.usuarios = this.usuarios.filter((u) => u.id !== usuario.id);
      this.cdr.detectChanges();
    } catch (err: any) {
      console.error(err);
      this.errorMessage =
        err?.error?.message || "No se pudo eliminar el usuario.";
    }
  }

  trackByUsuario(index: number, item: any): any {
    return item?.id || item?.email || index;
  }
}