import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Peticion } from '../../servicios/peticion';

@Component({
  selector: 'app-blog-admin-statico',
  imports: [Header, Footer, CommonModule, FormsModule],
  templateUrl: './blog-admin-statico.html',
  styleUrl: './blog-admin-statico.css'
})
export class BlogAdminStatico implements OnInit{
  constructor(private peticion:Peticion, private cdr: ChangeDetectorRef){}
  comunidades:any
  apodoLogeado:any

  ngOnInit(): void {
      this.apodoLogeado = localStorage.getItem("apodo")
      console.log(this.apodoLogeado)
      this.cargarComunidades()
  }

  cargarComunidades() {
    let post = {
      host: this.peticion.urlReal,
      path: "/comunidad/apodo/"+ this.apodoLogeado,
      payload: {
      }
    }
    this.peticion.get(post.host + post.path).then((res: any) => {
      console.log(res)
      this.comunidades = res
      this.cdr.detectChanges()
    }).catch((err) => {
      console.log(err)
      console.log("Error al obtener comunidades")
    })
  }
}
