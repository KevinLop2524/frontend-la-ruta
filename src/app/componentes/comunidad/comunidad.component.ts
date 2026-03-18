import { Header } from "../header/header";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Peticion } from "../../servicios/peticion";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink, RouterModule } from "@angular/router";
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
  apodo: string | null = null;
  comunidadseleccionada: any = null;
  comunidades: any[] = [];
  comunidadesFiltradas: any[] = [];
  usuario: any = {};

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
      try {
        this.rol = JSON.parse(rolesGuardados);
      } catch {
        this.rol = [];
      }
    } else if (roleUnico) {
      this.rol = [roleUnico];
    }

    this.cargarComunidades();
    this.buscarUsuario();
  }

  esAdmin(): boolean {
    return this.rol.includes("ROLE_ADMIN") || this.rol.includes("ADMIN");
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

    this.comunidadesFiltradas = this.comunidades.filter((comunidad) => {
      const coincideTexto =
        !termino ||
        comunidad?.name?.toLowerCase().includes(termino) ||
        comunidad?.description?.toLowerCase().includes(termino) ||
        this.traductiCategoria(comunidad?.category).toLowerCase().includes(termino);

      const coincideCategoria =
        this.categoriaActiva === "ALL" ||
        comunidad?.category === this.categoriaActiva;

      return coincideTexto && coincideCategoria;
    });
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaActiva = categoria;
    this.aplicarFiltros();
  }

  cargarComunidades(): void {
    this.loadingComunidades = true;
    this.limpiarFeedbackGeneral();

    const url = `${this.peticion.urlReal}/api/communities/active`;

    this.peticion
      .get(url)
      .then((res: any) => {
        this.comunidades = Array.isArray(res) ? res : [];
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
      case "NUTRITION":
        return "NUTRICIÓN";
      case "FITNESS":
        return "FITNESS";
      case "PERSONAL_DEVELOPMENT":
        return "DESARROLLO PERSONAL";
      default:
        return categoria || "";
    }
  }

  buscarUsuario(): void {
    const userStorage = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userStorage || !token) {
      console.warn("No hay usuario o token");
      return;
    }

    let user;

    try {
      user = JSON.parse(userStorage);
    } catch (error) {
      console.error("Error parseando user del localStorage", error);
      return;
    }

    if (!user?.id) {
      console.warn("Usuario sin ID válido");
      return;
    }

    const url = `${this.peticion.urlReal}/api/users/get/${user.id}`;

    this.peticion
      .get(url, token)
      .then((res: any) => {
        this.usuario = res?.data || res;
        this.nuevaComunidad.creatorId = this.usuario.id;
        this.cdr.markForCheck();
      })
      .catch((err: any) => {
        console.error("Error al encontrar usuario:", err);
      });
  }

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
      this.editError = "El nombre es obligatorio.";
      return false;
    }

    if (!this.comunidadEditar?.description?.trim()) {
      this.editError = "La descripción es obligatoria.";
      return false;
    }

    if (!this.comunidadEditar?.category) {
      this.editError = "La categoría es obligatoria.";
      return false;
    }

    return true;
  }

  actualizarComunidad(comunidad: any): void {
    if (!this.validarEdicionLocal()) {
      return;
    }

    const resultado = this.validar.validar({
      ...this.comunidadEditar,
      name: this.comunidadEditar.name?.trim(),
      description: this.comunidadEditar.description?.trim(),
    });

    if (!resultado.ok) {
      this.editError = resultado.error || "Error al guardar la comunidad.";
      return;
    }

    this.savingEdit = true;
    this.limpiarFeedbackEdicion();

    const token = localStorage.getItem("token") || undefined;

    const act = {
      host: this.peticion.urlReal,
      path: "/api/communities/update/" + comunidad.id,
      payload: {
        category: this.comunidadEditar.category,
        name: this.comunidadEditar.name.trim(),
        description: this.comunidadEditar.description.trim(),
      },
    };

    this.peticion
      .patch(act.host + act.path, act.payload, token)
      .then(() => {
        this.editSuccess = "La comunidad fue actualizada correctamente.";
        this.generalSuccess = "Cambios guardados correctamente.";
        this.cargarComunidades();

        setTimeout(() => {
          this.cerrarEditar();
        }, 700);
      })
      .catch((err: any) => {
        console.error("Error al actualizar la comunidad", err);
        this.editError =
          err?.error?.message || "No fue posible actualizar la comunidad.";
      })
      .finally(() => {
        this.savingEdit = false;
      });
  }

  eliminarComunidad(): void {
    if (!this.comunidadseleccionada?.id) {
      this.editError = "No hay una comunidad seleccionada para eliminar.";
      return;
    }

    this.deletingCommunity = true;
    this.limpiarFeedbackEdicion();
    this.limpiarFeedbackGeneral();

    const del = {
      host: this.peticion.urlReal,
      path: "/api/communities/delete/" + this.comunidadseleccionada.id,
    };

    this.peticion
      .delete(del.host + del.path, {})
      .then(() => {
        this.generalSuccess = "La comunidad fue eliminada correctamente.";
        this.cerrarEditar();
        this.cargarComunidades();
      })
      .catch((err: any) => {
        console.error("Error al eliminar la comunidad", err);
        this.editError =
          err?.error?.message || "No fue posible eliminar la comunidad.";
      })
      .finally(() => {
        this.deletingCommunity = false;
        this.cdr.detectChanges();
      });
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
        if (comunidad.creatorId === this.usuario.id) {
          this.router.navigate(["servicios/", comunidad.id]);
          return;
        }

        if (res?.isMember) {
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
      });
  }

  UnirmeComunidad(comunidadId: any): void {
    if (!this.usuario?.id) {
      this.generalError = "No se pudo identificar el usuario actual.";
      return;
    }

    this.limpiarFeedbackGeneral();

    const post = {
      host: this.peticion.urlReal,
      path: "/api/communities/" + comunidadId + "/join",
      payload: {
        userId: this.usuario.id,
      },
    };

    this.peticion
      .post(post.host + post.path, post.payload)
      .then(() => {
        this.generalSuccess = "Te uniste a la comunidad correctamente.";
        this.cargarComunidades();
      })
      .catch((err: any) => {
        console.error("Error al unirse a la comunidad", err);
        this.generalError =
          err?.error?.message || "No fue posible unirse a la comunidad.";
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
    this.comunidadEditar = {
      id: null,
      category: "",
      name: "",
      description: "",
    };
    this.comunidadseleccionada = null;
    this.submittedEdit = false;
    this.limpiarFeedbackEdicion();
  }

  trackByComunidadId(index: number, comunidad: any): number {
    return comunidad.id;
  }
}