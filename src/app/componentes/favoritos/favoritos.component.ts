import {
  ChangeDetectorRef,
  Component,
  OnInit,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { Peticion } from "../../servicios/peticion";

interface ComunidadFavorita {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  avatarUrl?: string | null;
}

interface ComunidadCreada {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  totalMiembros?: number;
}

@Component({
  selector: "app-favoritos",
  standalone: true,
  imports: [Header, Footer, CommonModule, FormsModule],
  templateUrl: "./favoritos.component.html",
  styleUrl: "./favoritos.component.css",
})
export class FavoritosComponent implements OnInit {
  tokenLog: string = "";
  userId: number | null = null;

  cargando = false;
  errorMessage = "";
  generalSuccess = "";
  searchTerm = "";

  // ── Comunidades unidas ──────────────────────────────────────
  comunidades: ComunidadFavorita[] = [];
  comunidadesFiltradas: ComunidadFavorita[] = [];

  // ── Estado menú unidas ──────────────────────────────────────
  menuAbiertoPara: number | null = null;
  confirmandoSalidaId: number | null = null;
  saliedoDeId: number | null = null;

  // ── Comunidades creadas ─────────────────────────────────────
  comunidadesCreadas: ComunidadCreada[] = [];
  comunidadesCreadasFiltradas: ComunidadCreada[] = [];

  // ── Estado confirmación eliminación ─────────────────────────
  menuAbiertoParaCreada: number | null = null;
  confirmandoEliminacionId: number | null = null;
  eliminandoId: number | null = null;

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.tokenLog = localStorage.getItem("token") || "";

    const userStorage = JSON.parse(localStorage.getItem("user") || "{}");
    this.userId = userStorage?.userId ?? userStorage?.id ?? null;

    if (!this.userId) {
      this.errorMessage = "No se pudo identificar el usuario actual.";
      return;
    }

    this.cargarTodo();
  }

  // ── Cierra menús al hacer clic fuera ────────────────────────
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest(".fv-dropdown")) {
      this.menuAbiertoPara = null;
      this.menuAbiertoParaCreada = null;
      this.cdr.detectChanges();
    }
  }

  // ────────────────────────────────────────────────────────────
  // CARGA DE DATOS
  // ────────────────────────────────────────────────────────────

  async cargarTodo(): Promise<void> {
    this.cargando = true;
    this.errorMessage = "";

    try {
      const [unidas, todas] = await Promise.all([
        this.peticion
          .get(
            `${this.peticion.urlReal}/api/communities/user/${this.userId}/communities`,
            this.tokenLog,
          )
          .catch(() => []),
        this.peticion
          .get(`${this.peticion.urlReal}/api/communities/all`, this.tokenLog)
          .catch(() => []),
      ]);

      this.comunidades = this.normalizarComunidades(unidas);

      // Filtrar las creadas por este usuario
      const todasArray: any[] = Array.isArray(todas)
        ? todas
        : (todas as any)?.data || [];
      this.comunidadesCreadas = todasArray
        .filter((c: any) => c.creatorId === this.userId)
        .map((c: any) => ({
          id: c.id,
          nombre: c.name || c.nombre || "Comunidad",
          descripcion: c.description || c.descripcion || "Sin descripción",
          categoria: c.category || c.categoria || "",
          totalMiembros: c.totalMiembros ?? c.memberCount ?? null,
        }));

      this.aplicarBusqueda();
    } catch (err: any) {
      this.errorMessage =
        err?.error?.message || "No fue posible cargar tus comunidades.";
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  normalizarComunidades(res: any): ComunidadFavorita[] {
    const data = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.comunidades)
          ? res.comunidades
          : [];

    return data.map((item: any) => ({
      id: item.id,
      nombre: item.nombre || item.name || "Comunidad",
      descripcion: item.descripcion || item.description || "Sin descripción",
      categoria: item.category || item.categoria || "",
      avatarUrl: item.avatarUrl || item.imageUrl || null,
    }));
  }

  // ────────────────────────────────────────────────────────────
  // FILTROS Y BÚSQUEDA
  // ────────────────────────────────────────────────────────────

  aplicarBusqueda(): void {
    const texto = this.searchTerm.trim().toLowerCase();

    if (!texto) {
      this.comunidadesFiltradas = [...this.comunidades];
      this.comunidadesCreadasFiltradas = [...this.comunidadesCreadas];
      return;
    }

    this.comunidadesFiltradas = this.comunidades.filter((c) =>
      `${c.nombre} ${c.descripcion}`.toLowerCase().includes(texto),
    );

    this.comunidadesCreadasFiltradas = this.comunidadesCreadas.filter((c) =>
      `${c.nombre} ${c.descripcion}`.toLowerCase().includes(texto),
    );
  }

  buscar(): void {
    this.aplicarBusqueda();
  }

  // ────────────────────────────────────────────────────────────
  // COMUNIDADES UNIDAS — SALIR
  // ────────────────────────────────────────────────────────────

  toggleMenu(id: number): void {
    this.menuAbiertoPara = this.menuAbiertoPara === id ? null : id;
  }

  pedirConfirmacionSalida(item: ComunidadFavorita): void {
    this.menuAbiertoPara = null;
    this.confirmandoSalidaId = item.id;
    this.generalSuccess = "";
    this.errorMessage = "";
  }

  cancelarSalida(): void {
    this.confirmandoSalidaId = null;
  }

  salirDeComunidad(item: ComunidadFavorita): void {
    if (!this.userId) return;

    this.saliedoDeId = item.id;
    this.generalSuccess = "";
    this.errorMessage = "";

    const url = `${this.peticion.urlReal}/api/communities/${item.id}/leave`;

    this.peticion
      .post(url, { userId: this.userId }, this.tokenLog)
      .then(() => {
        this.comunidades = this.comunidades.filter((c) => c.id !== item.id);
        this.comunidadesFiltradas = this.comunidadesFiltradas.filter(
          (c) => c.id !== item.id,
        );
        this.confirmandoSalidaId = null;
        this.generalSuccess = `Saliste de "${item.nombre}" correctamente.`;
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        this.errorMessage =
          err?.error?.message || "No fue posible salir de la comunidad.";
        this.confirmandoSalidaId = null;
      })
      .finally(() => {
        this.saliedoDeId = null;
        this.cdr.detectChanges();
      });
  }

  // ────────────────────────────────────────────────────────────
  // COMUNIDADES CREADAS — ELIMINAR
  // ────────────────────────────────────────────────────────────

  toggleMenuCreada(id: number): void {
    this.menuAbiertoParaCreada = this.menuAbiertoParaCreada === id ? null : id;
  }

  pedirConfirmacionEliminacion(item: ComunidadCreada): void {
    this.menuAbiertoParaCreada = null;
    this.confirmandoEliminacionId = item.id;
    this.generalSuccess = "";
    this.errorMessage = "";
  }

  cancelarEliminacion(): void {
    this.confirmandoEliminacionId = null;
  }

  eliminarComunidad(item: ComunidadCreada): void {
    this.eliminandoId = item.id;
    this.generalSuccess = "";
    this.errorMessage = "";

    const token = localStorage.getItem("token") || undefined;
    const url = `${this.peticion.urlReal}/api/communities/delete/${item.id}`;

    this.peticion
      .delete(url, {}, token)
      .then(() => {
        this.comunidadesCreadas = this.comunidadesCreadas.filter(
          (c) => c.id !== item.id,
        );
        this.comunidadesCreadasFiltradas =
          this.comunidadesCreadasFiltradas.filter((c) => c.id !== item.id);
        this.confirmandoEliminacionId = null;
        this.generalSuccess = `"${item.nombre}" fue eliminada correctamente.`;
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        this.errorMessage =
          err?.error?.message || "No fue posible eliminar la comunidad.";
        this.confirmandoEliminacionId = null;
        this.cdr.detectChanges();
      })
      .finally(() => {
        this.eliminandoId = null;
        this.cdr.detectChanges();
      });
  }

  // ────────────────────────────────────────────────────────────
  // NAVEGACIÓN
  // ────────────────────────────────────────────────────────────

  irAComunidad(item: ComunidadFavorita | ComunidadCreada): void {
    this.router.navigate(["/comunidad", item.id]);
  }

  editarComunidad(item: ComunidadCreada): void {
    this.menuAbiertoParaCreada = null;
    this.router.navigate(["/comunidad", item.id], { fragment: "info" });
  }

  // ────────────────────────────────────────────────────────────
  // HELPERS VISUALES
  // ────────────────────────────────────────────────────────────

  traducirCategoria(categoria: string): string {
    switch (categoria) {
      case "FITNESS":
        return "Fitness";
      case "NUTRITION":
        return "Nutrición";
      case "PERSONAL_DEVELOPMENT":
        return "Desarrollo personal";
      default:
        return categoria || "General";
    }
  }

  obtenerIniciales(nombre: string): string {
    return nombre
      .split(" ")
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join("")
      .toUpperCase();
  }

  obtenerClaseAvatar(index: number): string {
    const clases = ["", "fv-comm-avatar--green", "fv-comm-avatar--blue"];
    return clases[index % clases.length];
  }

  obtenerClaseBadge(categoria: string): string {
    switch (categoria) {
      case "FITNESS":
        return "fv-badge--fitness";
      case "NUTRITION":
        return "fv-badge--nutrition";
      case "PERSONAL_DEVELOPMENT":
        return "fv-badge--development";
      default:
        return "fv-badge--default";
    }
  }

  trackById(index: number, item: { id: number }): number {
    return item.id || index;
  }
}
