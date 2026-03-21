import { ChangeDetectorRef, Component, OnInit, HostListener } from "@angular/core";
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
  avatarUrl?: string | null;
}

interface ServicioFavorito {
  id: number;
  nombre: string;
  descripcion: string;
  imagenUrl?: string | null;
}

interface TopItem {
  id: number;
  tipo: "COMUNIDAD" | "SERVICIO";
  nombre: string;
  descripcion: string;
  imagenUrl?: string | null;
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

  comunidades: ComunidadFavorita[] = [];
  servicios: ServicioFavorito[] = [];
  topItems: TopItem[] = [];

  comunidadesFiltradas: ComunidadFavorita[] = [];
  serviciosFiltrados: ServicioFavorito[] = [];
  topItemsFiltrados: TopItem[] = [];

  // ── Estado del menú desplegable ──────────────────────────────
  menuAbiertoPara: number | null = null;

  // ── Estado de confirmación / salida ──────────────────────────
  confirmandoSalidaId: number | null = null;
  saliedoDeId: number | null = null;

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.tokenLog = localStorage.getItem("token") || "";

    const userStorage = JSON.parse(localStorage.getItem("user") || "{}");
    this.userId = userStorage?.userId || null;

    if (!this.userId) {
      this.errorMessage = "No se pudo identificar el usuario actual.";
      return;
    }

    this.cargarFavoritos();
  }

  // ── Cierra el menú si el usuario hace clic fuera ─────────────
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest(".fv-dropdown")) {
      this.menuAbiertoPara = null;
      this.cdr.detectChanges();
    }
  }

  // ── Menú desplegable ─────────────────────────────────────────
  toggleMenu(id: number): void {
    this.menuAbiertoPara = this.menuAbiertoPara === id ? null : id;
  }

  // ── Flujo de salida de comunidad ─────────────────────────────

  pedirConfirmacionSalida(item: ComunidadFavorita): void {
    this.menuAbiertoPara   = null;
    this.confirmandoSalidaId = item.id;
    this.generalSuccess    = "";
    this.errorMessage      = "";
  }

  cancelarSalida(): void {
    this.confirmandoSalidaId = null;
  }

  salirDeComunidad(item: ComunidadFavorita): void {
    if (!this.userId) return;

    this.saliedoDeId = item.id;
    this.generalSuccess = "";
    this.errorMessage   = "";

    const url     = `${this.peticion.urlReal}/api/communities/${item.id}/members/${this.userId}`;

    this.peticion.delete(url, this.tokenLog)
      .then((res) => {
        console.log(res)
        // Elimina la comunidad de la lista localmente, sin recargar
        this.comunidades          = this.comunidades.filter(c => c.id !== item.id);
        this.comunidadesFiltradas = this.comunidadesFiltradas.filter(c => c.id !== item.id);
        this.confirmandoSalidaId  = null;
        this.generalSuccess       = `Saliste de "${item.nombre}" correctamente.`;
      })
      .catch((err: any) => {
        console.error("Error al salir de la comunidad", err);
        this.errorMessage = err?.error?.message || "No fue posible salir de la comunidad.";
        this.confirmandoSalidaId = null;
      })
      .finally(() => {
        this.saliedoDeId = null;
        this.cdr.detectChanges();
      });
  }

  // ── Carga de datos ───────────────────────────────────────────

  async cargarFavoritos(): Promise<void> {
    this.cargando = true;
    this.errorMessage = "";

    try {
      const [comunidadesRes, serviciosRes] = await Promise.all([
        this.peticion.get(
          `${this.peticion.urlReal}/api/communities/user/${this.userId}/communities`,
          this.tokenLog,
        ),
        this.peticion.get(
          `${this.peticion.urlReal}/api/services/${this.userId}/active`,
          this.tokenLog,
        ),
      ]);

      this.comunidades = this.normalizarComunidades(comunidadesRes);
      this.servicios   = this.normalizarServicios(serviciosRes);

      this.aplicarBusqueda();
    } catch (err: any) {
      console.error(err);
      this.errorMessage =
        err?.error?.message || "No fue posible cargar tus favoritos.";
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  normalizarComunidades(res: any): ComunidadFavorita[] {
    const data = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)       ? res.data
      : Array.isArray(res?.comunidades) ? res.comunidades
      : [];

    return data.map((item: any) => ({
      id:          item.id,
      nombre:      item.nombre || item.name        || "Comunidad",
      descripcion: item.descripcion || item.description || "Sin descripción",
      avatarUrl:   item.avatarUrl || item.imageUrl  || null,
    }));
  }

  normalizarServicios(res: any): ServicioFavorito[] {
    const data = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)     ? res.data
      : Array.isArray(res?.servicios) ? res.servicios
      : [];

    return data.map((item: any) => ({
      id:          item.id,
      nombre:      item.nombre || item.name        || "Servicio",
      descripcion: item.descripcion || item.description || "Sin descripción",
      imagenUrl:   item.imagenUrl || item.imageUrl  || item.coverUrl || null,
    }));
  }

  normalizarTop(res: any): TopItem[] {
    const data = Array.isArray(res)
      ? res
      : Array.isArray(res?.data) ? res.data
      : Array.isArray(res?.top)  ? res.top
      : [];

    return data.map((item: any) => ({
      id:          item.id,
      tipo:        item.tipo || item.type           || "SERVICIO",
      nombre:      item.nombre || item.name         || "Elemento",
      descripcion: item.descripcion || item.description || "Sin descripción",
      imagenUrl:   item.imagenUrl || item.imageUrl  || item.coverUrl || null,
    }));
  }

  aplicarBusqueda(): void {
    const texto = this.searchTerm.trim().toLowerCase();

    if (!texto) {
      this.comunidadesFiltradas = [...this.comunidades];
      this.serviciosFiltrados   = [...this.servicios];
      this.topItemsFiltrados    = [...this.topItems];
      return;
    }

    this.comunidadesFiltradas = this.comunidades.filter(item =>
      `${item.nombre} ${item.descripcion}`.toLowerCase().includes(texto),
    );

    this.serviciosFiltrados = this.servicios.filter(item =>
      `${item.nombre} ${item.descripcion}`.toLowerCase().includes(texto),
    );

    this.topItemsFiltrados = this.topItems.filter(item =>
      `${item.nombre} ${item.descripcion}`.toLowerCase().includes(texto),
    );
  }

  buscar(): void { this.aplicarBusqueda(); }

  irAComunidad(item: ComunidadFavorita): void {
    this.router.navigate([`/servicios/${item.id}`]);
  }

  irAServicio(item: ServicioFavorito): void {
    this.router.navigate([`/servicio/${item.id}`]);
  }

  irATop(item: TopItem): void {
    const ruta = item.tipo === "COMUNIDAD"
      ? `/servicios/${item.id}`
      : `/servicio/${item.id}`;
    this.router.navigate([ruta]);
  }

  obtenerIniciales(nombre: string): string {
    return nombre.split(" ").slice(0, 2).map(p => p.charAt(0)).join("").toUpperCase();
  }

  obtenerClaseAvatar(index: number): string {
    const clases = ["", "fv-comm-avatar--green", "fv-comm-avatar--blue"];
    return clases[index % clases.length];
  }

  imagenPorDefectoServicio(): string {
    return "/imagenes/static/imgGymUno.jpg";
  }

  trackById(index: number, item: { id: number }): number {
    return item.id || index;
  }
}