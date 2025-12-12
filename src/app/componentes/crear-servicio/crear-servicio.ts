declare var bootstrap: any;

import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
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


  idComunidad: number = 0;   //Guardar el id de la comunidad
  usuario: any = {};         // Guardar el id del usuario (opcional)

  formServicio: any = {
    name: '',
    description: '',
    type: '',
    communityId: null
  };

  constructor(private route: ActivatedRoute, private peticion: Peticion) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idComunidad = +id;
      this.formServicio.communityId = this.idComunidad;
      console.log("ID Comunidad recibido en CrearServicio:", this.idComunidad);
      this.cargarServiciosDeComunidad(); // cargar los servicios
    }
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
      communityId: this.idComunidad   // Se guarda el id de la comunidad en el payload.
    };

    console.log("Payload CrearServicio:", payload);

    this.peticion.post(`${this.peticion.urlReal}/api/services/create`, payload, token)
      .then(() => {
        Swal.fire("¡Éxito!", "Servicio creado correctamente", "success");
        this.closeModal();
        this.formServicio = { name: '', description: '', type: '', communityId: this.idComunidad };
      })
      .catch((err: any) => {
        Swal.fire("Error", err.error?.mensaje || "Error al crear el servicio", "error");
      });
  }
  servicios: any[] = [];

  cargarServiciosDeComunidad() {
    const token = localStorage.getItem('token') || undefined;
    this.peticion.get(`${this.peticion.urlReal}/api/services/community/${this.idComunidad}`, token)
      .then((res: any) => {
        this.servicios = Array.isArray(res) ? res : (res ? [res] : []);
      })
      .catch(err => console.error("Error al obtener servicios de la comunidad", err));
  }
}