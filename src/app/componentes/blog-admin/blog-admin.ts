import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Footer } from "../footer/footer";
import { Header } from "../header/header";
import { Peticion } from '../../servicios/peticion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-blog-admin',
  imports: [Footer, Header, CommonModule, FormsModule],
  templateUrl: './blog-admin.html',
  styleUrl: './blog-admin.css'
})
export class BlogAdmin implements OnInit{
  comunidades: any
constructor(private peticion: Peticion, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargarComunidades();
  }

  cargarComunidades() {
    let post = {
      host: this.peticion.urlReal,
      path: "/api/comunidades",
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
