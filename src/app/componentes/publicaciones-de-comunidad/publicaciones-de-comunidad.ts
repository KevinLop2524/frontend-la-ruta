import { Header } from '../header/header';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router, RouterLink } from '@angular/router';
import { Footer } from '../footer/footer';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-publicaciones-de-comunidad',
  imports: [Header, CommonModule, FormsModule, Footer, RouterModule],
  templateUrl: './publicaciones-de-comunidad.html',
  styleUrl: './publicaciones-de-comunidad.css'
})
export class PublicacionesDeComunidad {

  constructor(private peticion: Peticion, private cdr: ChangeDetectorRef, private router: Router) { }

  nuevaPublicacion: any = {
    title: '',
    content: '',
    userId: null
  };

  crearPublicacion() {
    console.log("Publicación creada:", this.nuevaPublicacion);

  }

}
