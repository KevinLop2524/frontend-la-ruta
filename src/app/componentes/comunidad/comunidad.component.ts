import { Header } from "../header/header";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Peticion } from "../../servicios/peticion";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { Footer } from "../footer/footer";
import { comunidadZodValidator } from "../../validators/comunidad-zod.validator";

@Component({
  selector: "app-comunidad",
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: "./comunidad.component.html",
  styleUrl: "./comunidad.component.css",
  providers: [comunidadZodValidator],
})
export class ComunidadComponent implements OnInit {
  rol: string[] = [];
  comunidadseleccionada: any = null;
  comunidades: any[] = [];
  comunidadesFiltradas: any[] = [];
  usuario: any = {};

  // IDs de comunidades a las que ya pertenece el usuario
  idsUnidas: Set<number> = new Set();

  searchTerm: string = "";
  categoriaActiva: string = "ALL";

  loadingComunidades: boolean = false;
  joiningCommunityId: number | null = null;
  savingEdit: boolean = false;
  deletingCommunity: boolean = false;
  submittedEdit: boolean = false;

  generalError: string = "";
  generalSuccess: string = "";
  editError: string = "";
  editSuccess: string = "";

  nuevaComunidad: any = {
    category: "",
    name: "",
    description: "",
    creatorId: null,
    active: true,
  };

  comunidadEditar: any = {
    id: null,
    category: "",
    name: "",
    description: "",
  };

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
    private validar: comunidadZodValidator,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const rolesGuardados = localStorage.getItem("roles");
    const roleUnico = localStorage.getItem("role");

    if (rolesGuardados) {
      try { this.rol = JSON.parse(rolesGuardados); } catch { this.rol = []; }
    } else if (roleUnico) {
      this.rol = [roleUnico];
    }

    this.buscarUsuario();
    this.cargarComunidades();
  }

  esAdmin(): boolean {
    return this.rol.includes("ROLE_ADMIN") || this.rol.includes("ADMIN");
  }

  // ── Comprueba si el usuario ya pertenece a una comunidad ─────────────────
  esMiembro(comunidadId: number): boolean {
    return this.idsUnidas.has(comunidadId);
  }

  limpiarFeedbackGeneral(): void {
    this.generalError = "";
    this.generalSuccess = "";
  }

  limpiarFeedbackEdicion(): void {
    this.editError = "";
    this.editSuccess = "";
  }

  aplicarFiltros(): void {
    const termino = this.searchTerm.trim().toLowerCase();

    this.comunidadesFiltradas = this.comunidades.filter((c) => {
      const coincideTexto =
        !termino ||
        c?.name?.toLowerCase().includes(termino) ||
        c?.description?.toLowerCase().includes(termino) ||
        this.traductiCategoria(c?.category).toLowerCase().includes(termino);

      const coincideCategoria =
        this.categoriaActiva === "ALL" || c?.category === this.categoriaActiva;

      return coincideTexto && coincideCategoria;
    });
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaActiva = categoria;
    this.aplicarFiltros();
  }

  // ── Carga todas las comunidades activas + detecta cuáles ya unió ─────────
  cargarComunidades(): void {
    this.loadingComunidades = true;
    this.limpiarFeedbackGeneral();

    const userStorage = localStorage.getItem("user");
    const idUsuario = userStorage ? JSON.parse(userStorage)?.userId ?? JSON.parse(userStorage)?.id : null;

    // Llamadas en paralelo: todas las activas + las que ya se unió el usuario
    const urlTodas  = `${this.peticion.urlReal}/api/communities/all`;
    const urlUnidas = idUsuario
      ? `${this.peticion.urlReal}/api/communities/user/${idUsuario}/communities`
      : null;

    const promesaTodas  = this.peticion.get(urlTodas);
    const promesaUnidas = urlUnidas
      ? this.peticion.get(urlUnidas).catch(() => [])   // si el endpoint no existe aún, silencioso
      : Promise.resolve([]);

    Promise.all([promesaTodas, promesaUnidas])
      .then(([todas, unidas]: any) => {
        this.comunidades = Array.isArray(todas) ? todas : [];

        // Construye el set de IDs unidas para consulta O(1)
        const listaUnidas: any[] = Array.isArray(unidas) ? unidas : [];
        this.idsUnidas = new Set(listaUnidas.map((c: any) => c.id));

        // Si el creador también debe ver "Ir", agrégalo al set
        if (this.usuario?.id) {
          this.comunidades.forEach((c: any) => {
            if (c.creatorId === this.usuario.id) {
              this.idsUnidas.add(c.id);
            }
          });
        }

        this.aplicarFiltros();
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error("Error al cargar comunidades:", err);
        this.generalError = "No fue posible cargar las comunidades.";
        this.comunidades = [];
        this.comunidadesFiltradas = [];
      })
      .finally(() => {
        this.loadingComunidades = false;
        this.cdr.detectChanges();
      });
  }

  traductiCategoria(categoria: string): string {
    switch (categoria) {
      case "NUTRITION":        return "NUTRICIÓN";
      case "FITNESS":          return "FITNESS";
      case "PERSONAL_DEVELOPMENT": return "DESARROLLO PERSONAL";
      default:                 return categoria || "";
    }
  }

  buscarUsuario(): void {
    const userStorage = localStorage.getItem("user");
    const token       = localStorage.getItem("token");

    if (!userStorage || !token) return;

    let user;
    try { user = JSON.parse(userStorage); } catch { return; }

    const userId = user?.userId ?? user?.id;
    if (!userId) return;

    const url = `${this.peticion.urlReal}/api/users/get/${userId}`;

    this.peticion.get(url, token)
      .then((res: any) => {
        this.usuario = res?.data || res;
        this.nuevaComunidad.creatorId = this.usuario.id;

        // Una vez que tenemos el usuario, marcamos sus comunidades creadas
        this.comunidades.forEach((c: any) => {
          if (c.creatorId === this.usuario.id) this.idsUnidas.add(c.id);
        });

        this.cdr.detectChanges();
      })
      .catch((err: any) => console.error("Error al encontrar usuario:", err));
  }

  // ── Acción del botón principal de cada comunidad ─────────────────────────
  accionComunidad(comunidad: any): void {
    // Si ya es miembro o creador → navegar directo
    if (this.esMiembro(comunidad.id)) {
      this.router.navigate(["servicios/", comunidad.id]);
      return;
    }

    // Si no es miembro → verificar y mostrar modal de unirse
    this.verificarMembresia(comunidad);
  }

  verificarMembresia(comunidad: any): void {
    if (!this.usuario?.id) {
      this.generalError = "No se pudo validar tu usuario actual.";
      return;
    }

    this.joiningCommunityId = comunidad.id;
    this.limpiarFeedbackGeneral();

    const url = `${this.peticion.urlReal}/api/communities/${comunidad.id}/is-member/${this.usuario.id}`;

    this.peticion.get(url)
      .then((res: any) => {
        if (comunidad.creatorId === this.usuario.id || res?.isMember) {
          this.idsUnidas.add(comunidad.id);
          this.router.navigate(["servicios/", comunidad.id]);
          return;
        }

        this.comunidadseleccionada = comunidad;
        document.getElementById("abrirUnirse")?.click();
      })
      .catch((err: any) => {
        console.error("Error al verificar membresía:", err);
        this.generalError = "No fue posible validar la membresía.";
      })
      .finally(() => {
        this.joiningCommunityId = null;
        this.cdr.detectChanges();
      });
  }

  UnirmeComunidad(comunidadId: any): void {
    if (!this.usuario?.id) {
      this.generalError = "No se pudo identificar el usuario actual.";
      return;
    }

    this.limpiarFeedbackGeneral();

    const url     = `${this.peticion.urlReal}/api/communities/${comunidadId}/join`;
    const payload = { userId: this.usuario.id };

    this.peticion.post(url, payload)
      .then(() => {
        this.generalSuccess = "¡Te uniste a la comunidad correctamente!";
        // Actualiza el set localmente, sin recargar toda la lista
        this.idsUnidas.add(comunidadId);
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error("Error al unirse a la comunidad", err);
        this.generalError = err?.error?.message || "No fue posible unirse a la comunidad.";
        this.cdr.detectChanges();
      });
  }

  // ── Edición / eliminación (solo admin) ───────────────────────────────────

  abrirModal(comunidad: any): void {
    this.comunidadseleccionada = comunidad;
    this.comunidadEditar = { ...comunidad };
    this.limpiarFeedbackEdicion();
    this.submittedEdit = false;
  }

  validarEdicionLocal(): boolean {
    this.submittedEdit = true;
    this.limpiarFeedbackEdicion();

    if (!this.comunidadEditar?.name?.trim()) {
      this.editError = "El nombre es obligatorio."; return false;
    }
    if (!this.comunidadEditar?.description?.trim()) {
      this.editError = "La descripción es obligatoria."; return false;
    }
    if (!this.comunidadEditar?.category) {
      this.editError = "La categoría es obligatoria."; return false;
    }
    return true;
  }

  actualizarComunidad(comunidad: any): void {
    if (!this.validarEdicionLocal()) return;

    const resultado = this.validar.validar({
      ...this.comunidadEditar,
      name:        this.comunidadEditar.name?.trim(),
      description: this.comunidadEditar.description?.trim(),
    });

    if (!resultado.ok) {
      this.editError = resultado.error || "Error al guardar la comunidad.";
      return;
    }

    this.savingEdit = true;
    this.limpiarFeedbackEdicion();

    const token = localStorage.getItem("token") || undefined;
    const url   = `${this.peticion.urlReal}/api/communities/update/${comunidad.id}`;
    const payload = {
      category:    this.comunidadEditar.category,
      name:        this.comunidadEditar.name.trim(),
      description: this.comunidadEditar.description.trim(),
    };

    this.peticion.patch(url, payload, token)
      .then(() => {
        this.editSuccess    = "La comunidad fue actualizada correctamente.";
        this.generalSuccess = "Cambios guardados correctamente.";
        this.cargarComunidades();
        setTimeout(() => this.cerrarEditar(), 700);
      })
      .catch((err: any) => {
        this.editError = err?.error?.message || "No fue posible actualizar la comunidad.";
      })
      .finally(() => { this.savingEdit = false; });
  }

  eliminarComunidad(): void {
    if (!this.comunidadseleccionada?.id) {
      this.editError = "No hay una comunidad seleccionada para eliminar.";
      return;
    }

    this.deletingCommunity = true;
    this.limpiarFeedbackEdicion();
    this.limpiarFeedbackGeneral();

    const url = `${this.peticion.urlReal}/api/communities/delete/${this.comunidadseleccionada.id}`;

    this.peticion.delete(url, {})
      .then(() => {
        this.generalSuccess = "La comunidad fue eliminada correctamente.";
        this.cerrarEditar();
        this.cargarComunidades();
      })
      .catch((err: any) => {
        this.editError = err?.error?.message || "No fue posible eliminar la comunidad.";
      })
      .finally(() => {
        this.deletingCommunity = false;
        this.cdr.detectChanges();
      });
  }

  toggleEditar(comunidad: any): void {
    if (this.comunidadEditar?.id === comunidad.id) {
      this.cerrarEditar();
    } else {
      this.comunidadseleccionada = comunidad;
      this.comunidadEditar = { ...comunidad };
      this.limpiarFeedbackEdicion();
      this.submittedEdit = false;
    }
  }

  cerrarEditar(): void {
    this.comunidadEditar = { id: null, category: "", name: "", description: "" };
    this.comunidadseleccionada = null;
    this.submittedEdit = false;
    this.limpiarFeedbackEdicion();
  }

  trackByComunidadId(index: number, comunidad: any): number {
    return comunidad.id;
  }
}