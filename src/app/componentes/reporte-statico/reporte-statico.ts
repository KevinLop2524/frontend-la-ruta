import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reporte-statico',
  imports: [Header, Footer, CommonModule, FormsModule],
  templateUrl: './reporte-statico.html',
  styleUrl: './reporte-statico.css'
})
export class ReporteStatico implements OnInit {

  usuarios: any[] = [];
  tokenLog: any;

  filtros = {
    fullName: '',
    email: '',
    role: '',
    active: '',
    fechaInicio: "2000/01/01",
    fechaFin: '2050/01/01'
  };

  constructor(
    private peticion: Peticion,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.tokenLog = localStorage.getItem("token");
    this.aplicarFiltros();
  }

  /** ============================
   *  Cargar todos los usuarios
   * ============================ */
  aplicarFiltros() {
    let post = {
      host: this.peticion.urlReal,
      path: "/api/reportes/usuarios/lista",
      payload: {},
      token: this.tokenLog
    }
    this.peticion.post(post.host + post.path, post.payload).then((res: any) => {
      console.log(res)
      this.usuarios = res
      this.cdr.detectChanges()
    }).catch((err) => {
      console.log(err)
      console.log("Error al obtener usuarios")
    })
  }


  limpiarFiltros() {
    this.filtros = {
      fullName: '',
      email: '',
      role: '',
      active: '',
      fechaInicio: "2000/01/01",
      fechaFin: '2050/01/01'
    };

    this.aplicarFiltros();
  }

  reporte() {
  this.peticion
  .downloadPdfPost(
    this.peticion.urlReal + "/api/reportes/usuarios/pdf",
    this.filtros,
    this.tokenLog
  )
  .then((blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "usuarios_reporte.pdf";
    a.click();
  })
  .catch(err => console.log(err));
 
  }

}