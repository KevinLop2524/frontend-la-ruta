import { Routes } from '@angular/router';
import { InicioSesion } from './componentes/inicio-sesion/inicio-sesion';
import { BlogPrincipal } from './componentes/blog-principal/blog-principal';
import { Perfil } from './componentes/perfil/perfil';
import { ServicioComponent } from './componentes/servicio/servicio.component';
import { ComunidadComponent } from './componentes/comunidad/comunidad.component';
import { FavoritosComponent } from './componentes/favoritos/favoritos.component';
import { Registro } from './componentes/registro/registro';
import { ReporteStatico } from './componentes/reporte-statico/reporte-statico';
import { AuthGuard } from './guards/auth-guard';
import { EditarPerfilComponent } from './componentes/editar-perfil/editar-perfil.component';
import { PublicacionesDeComunidad } from './componentes/publicaciones-de-comunidad/publicaciones-de-comunidad';
import { CargaDatos } from './componentes/carga-datos/carga-datos';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./componentes/inicio-sesion/inicio-sesion').then(m => m.InicioSesion) },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'blog', component: BlogPrincipal, canActivate: [AuthGuard] },
  { path: 'perfil', component: Perfil, canActivate: [AuthGuard] },
  { path: 'servicios', component: ServicioComponent, canActivate: [AuthGuard] },
  { path: 'servicios/:id', component: ServicioComponent, canActivate: [AuthGuard] },
  { path: 'comunidades', component: ComunidadComponent, canActivate: [AuthGuard] },
  { path: 'favoritos', component: FavoritosComponent, canActivate: [AuthGuard] },
  { path: 'registro', component: Registro },
  { path: 'BlogAdmin', component: ReporteStatico },
  { path: 'editarPerfil', component: EditarPerfilComponent, canActivate: [AuthGuard] },
  { path: 'cargaDatos', component: CargaDatos },
  { path: 'publicaciones/:id', component: PublicacionesDeComunidad}
];
