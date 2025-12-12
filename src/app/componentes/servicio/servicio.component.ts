import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Peticion } from '../../servicios/peticion';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Footer } from '../footer/footer';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicio',
  standalone: true,
  imports: [CommonModule, Header, Footer, FormsModule, RouterModule],
  templateUrl: './servicio.component.html',
  styleUrl: './servicio.component.css'
})
export class ServicioComponent implements OnInit {

  datosNoPermitidos: (string | null | undefined)[] = ["", null, undefined];

  servicios: any[] = [];
  idComunidad: number = 0;
  usuario: any = {};
  comunidad: any = {};

  ServicioCrear: any = {
    name: '',
    description: '',
    type: '',
    userFitness: '',
    communityId: ''
  };

  modalModo: 'crear' | 'editar' = 'crear';
  modalRef: any;

  formServicio: any = {
    id: null,
    name: '',
    description: '',
    type: '',
    userFitness: null,
    communityId: null
  };

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idComunidad = +id;
      this.buscarUsuario();
      this.BuscarComunidad();
    }
  }

  buscarUsuario() {
    let token = localStorage.getItem('token') || undefined;
    this.peticion.get(this.peticion.urlReal + "/api/users/me", token)
      .then((res: any) => {
        this.usuario = res;
        this.cdr.detectChanges();
        this.cargarServicios();
      })
      .catch((err: any) => console.log("Error al encontrar usuario", err));
  }

  BuscarComunidad() {
    let token = localStorage.getItem('token') || undefined;
    this.peticion.get(`${this.peticion.urlReal}/api/communities/get/${this.idComunidad}`, token)
      .then((res: any) => {
        this.comunidad = res;
        this.cdr.detectChanges();
        console.log(this.comunidad)
        console.log(this.usuario)

      })
      .catch((err) => console.error("Error al obtener la comunidad", err));
  }

  cargarServicios() {
    if (!this.usuario?.id || !this.idComunidad) return;

    this.peticion.get(
      `${this.peticion.urlReal}/api/services/user/${this.usuario.id}/community/${this.idComunidad}`
    )
      .then((res: any) => {
        this.servicios = Array.isArray(res) ? res : (res ? [res] : []);
        this.cdr.detectChanges();
      })
      .catch((err) => {
        console.error("Error al obtener servicios por comunidad", err);
        this.servicios = [];
      });
  }

  crearServicio() {
    if (this.datosNoPermitidos.includes(this.ServicioCrear.name)) {
      Swal.fire({ title: 'Error', text: 'El nombre es obligatorio', icon: 'warning' });
      return;
    }
    if (this.datosNoPermitidos.includes(this.ServicioCrear.description)) {
      Swal.fire({ title: 'Error', text: 'La descripción es obligatoria', icon: 'warning' });
      return;
    }
    if (this.datosNoPermitidos.includes(this.ServicioCrear.type)) {
      Swal.fire({ title: 'Error', text: 'Debes seleccionar una categoría', icon: 'warning' });
      return;
    }

    const token = localStorage.getItem('token') || undefined;

    const payload = {
      name: this.ServicioCrear.name,
      description: this.ServicioCrear.description,
      type: this.ServicioCrear.type,
      userFitness: this.usuario.userFitnessId,
      communityId: this.idComunidad
    };

    this.peticion.post(`${this.peticion.urlReal}/api/services/create`, payload, token)
      .then(() => {
        Swal.fire('¡Éxito!', 'Servicio creado correctamente', 'success');
        this.cargarServicios();

        this.ServicioCrear = {
          name: '',
          description: '',
          type: '',
          userFitness: this.usuario.userFitnessId,
          communityId: this.idComunidad
        };
      })
      .catch((err: any) => {
        Swal.fire('Error', err.error?.mensaje || 'Error al crear el servicio', 'error');
      });
  }

  mostrarModal() {
    const modalElement = document.getElementById('modalServicio');
    this.modalRef = new (window as any).bootstrap.Modal(modalElement!);
    this.modalRef.show();
  }

  abrirCrear() {
    this.modalModo = 'crear';
    this.formServicio = {
      id: null,
      name: '',
      description: '',
      type: '',
      userFitness: this.usuario.userFitnessId,
      communityId: this.idComunidad
    };
    this.mostrarModal();
  }

  abrirEditar(servicio: any) {
    this.modalModo = 'editar';
    this.formServicio = {
      id: servicio.id,
      name: servicio.name,
      description: servicio.description,
      type: servicio.type,
      userFitness: this.usuario.userFitnessId,
      communityId: this.idComunidad
    };
    this.mostrarModal();
  }

  guardarModal() {
    if (this.modalModo === 'crear') {
      this.crearServicio();
    } else {
      this.actualizarServicio();
    }
  }

  actualizarServicio() {
  if (!this.formServicio.name.trim()) {
    Swal.fire('Error', 'El nombre es obligatorio', 'warning');
    return;
  }
  if (!this.formServicio.description.trim()) {
    Swal.fire('Error', 'La descripción es obligatoria', 'warning');
    return;
  }
  if (!this.formServicio.type) {
    Swal.fire('Error', 'Debe seleccionar un tipo', 'warning');
    return;
  }

  const token = localStorage.getItem('token') || undefined;

  const payload: any = {
    name: this.formServicio.name,
    description: this.formServicio.description,
    type: String(this.formServicio.type)
              .toUpperCase()
              .trim()
              .replace(/ /g, "_")
  };

  console.log("PAYLOAD:", payload);

  this.peticion.put(
    `${this.peticion.urlReal}/api/services/update/${this.formServicio.id}`,
    payload,
    token
  )
    .then(() => {
      Swal.fire('Actualizado', 'Servicio actualizado correctamente', 'success');
      this.cargarServicios();
      this.modalRef.hide();
    })
    .catch(err => {
      console.error("ERROR BACKEND:", err);
      Swal.fire('Error', err.error?.message || 'No se pudo actualizar', 'error');
    });
}


}
