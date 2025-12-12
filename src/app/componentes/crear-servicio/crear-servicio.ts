declare var bootstrap: any;

import { Component, ElementRef, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { Peticion } from '../../servicios/peticion';

@Component({
  selector: 'app-crear-servicio',
  templateUrl: './crear-servicio.html',
  styleUrls: ['./crear-servicio.css'],
  standalone: true,
  imports: [Header, Footer, FormsModule, CommonModule]
})
export class CrearServicio implements OnInit {

  @ViewChild('modalServicio') modalServicio!: ElementRef;
  modalInstance: any;

  usuario: any = {}; 
  comunidad: any = {};
  servicios: any[] = [];

  idComunidad: number = 0;

  formServicio: any = {
    id: null,
    name: '',
    description: '',
    type: '',
    userId: null,
    communityId: null
  };

  constructor(
    private route: ActivatedRoute,
    private peticion: Peticion,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id'); //con esto leo el id de la comunidad
    if (id) {
      this.idComunidad = +id;
      this.formServicio.communityId = this.idComunidad;
    }

    
    this.buscarUsuario(); //con esto cargo usuario y luego servicios
  }

  buscarUsuario() {
    const token = localStorage.getItem("token") || undefined;

    this.peticion.get(`${this.peticion.urlReal}/api/users/me`, token)
      .then((res: any) => {

        this.usuario = res;
        this.formServicio.userId = res.id;

        console.log("Usuario cargado:", res);

        this.cdr.detectChanges();
        this.BuscarComunidad();
        this.cargarServiciosDeComunidad();
      })
      .catch(err => {
        console.error("❌ Error al obtener usuario", err);
      });
  }

  BuscarComunidad() {
    const token = localStorage.getItem("token") || undefined;

    this.peticion.get(`${this.peticion.urlReal}/api/communities/get/${this.idComunidad}`, token)
      .then((res: any) => {
        this.comunidad = res;
        this.cdr.detectChanges();
      })
      .catch(err => console.error("Error al obtener comunidad", err));
  }


  openModal() {
    const modalEl = this.modalServicio.nativeElement;
    this.modalInstance = new bootstrap.Modal(modalEl);
    this.modalInstance.show();
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  guardarModal() {

  if (!this.formServicio.name.trim()) {
    Swal.fire("Error", "El nombre es obligatorio", "warning");
    return;
  }

  if (!this.formServicio.description.trim()) {
    Swal.fire("Error", "La descripción es obligatoria", "warning");
    return;
  }

  if (!this.formServicio.type) {
    Swal.fire("Error", "Debe seleccionar un tipo", "warning");
    return;
  }

  const token = localStorage.getItem('token') || undefined;

  const payload = {
    name: this.formServicio.name,
    description: this.formServicio.description,
    type: this.formServicio.type,
    userId: this.usuario.id,
    communityId: this.idComunidad
  };

  console.log("Payload:", payload);

  this.peticion.post(`${this.peticion.urlReal}/api/services/create`, payload, token)
    .then(() => {
      Swal.fire("¡Éxito!", "Servicio creado correctamente", "success");
      this.closeModal();

      this.formServicio = {
        id: null,
        name: '',
        description: '',
        type: '',
        userId: this.usuario.id,
        communityId: this.idComunidad
      };

      this.cargarServiciosDeComunidad();
    })
    .catch(err => {
      Swal.fire("Error", err.error?.mensaje || "Error al crear el servicio", "error");
    });

  return;
}

  cargarServiciosDeComunidad() {

    if (!this.usuario?.id) {
      console.error(" usuario.id inválido:", this.usuario);
      return;
    }

    const token = localStorage.getItem("token") || undefined;

    this.peticion.get(
      `${this.peticion.urlReal}/api/services/community/${this.idComunidad}/all?userId=${this.usuario.id}`,
      token
    )
      .then((res: any) => {
        this.servicios = Array.isArray(res) ? res : [res];
        console.log("Servicios cargados:", this.servicios);
        this.cdr.detectChanges();
      })
      .catch(err => console.error("Error al obtener servicios", err));
  }
}
