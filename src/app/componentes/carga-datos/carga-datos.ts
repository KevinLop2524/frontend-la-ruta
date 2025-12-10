import { Header } from '../header/header';
import { Component } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Footer } from '../footer/footer';
import { RouterModule } from '@angular/router';
import { any } from 'zod/v4';

@Component({
  selector: 'app-carga-datos',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './carga-datos.html',
  styleUrl: './carga-datos.css'
})
export class CargaDatos {

  file: File | null = null;
  entityType: string = '';
  keepFileOnErrors: boolean = false;

  successMessage: string = '';
  errorMessage: string = '';

  constructor(private peticion: Peticion) {}

  onFileSelected(event: any) {
    this.file = event.target.files[0] ?? null;
  }

  async subirArchivo() {

    this.successMessage = '';
    this.errorMessage = '';

    if (!this.file) {
      this.errorMessage = "Debe seleccionar un archivo.";
      return;
    }

    if (!this.entityType) {
      this.errorMessage = "Debe seleccionar un tipo de entidad.";
      return;
    }

    const formData = new FormData();
    formData.append("file", this.file);
    formData.append("entityType", this.entityType);
    formData.append("keepFileOnErrors", String(this.keepFileOnErrors));


    const post = {
      host: this.peticion.urlReal,
      path: "/api/v1/admin/bulk-upload",
      payload: formData   
    };

    try {

       const respuesta: any = await this.peticion.uploadBulk(
        post.payload,
        post.host + post.path
      );

      console.log("Respuesta:", respuesta);

      Swal.fire({
        icon: "info",
        title: "Carga completada",
        text: "La carga masiva finalizó correctamente."+ respuesta.summary,
      });

    } catch (err: any) {
      console.log("ERROR:",  this.entityType, "datos: ", this.file);

      this.errorMessage =
        err.error?.message || "Error al procesar la carga masiva";
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: this.errorMessage
      });
    }
  }
}
