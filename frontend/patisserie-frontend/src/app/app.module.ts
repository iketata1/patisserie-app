import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { CatalogueComponent } from './components/catalogue/catalogue.component';
import { CarteProduitComponent } from './components/carte-produit/carte-produit.component';
import { AccueilComponent } from './pages/accueil/accueil.component';
import { NosCreationsComponent } from './pages/nos-creations/nos-creations.component';
import { AProposComponent } from './pages/a-propos/a-propos.component';
import { ContactComponent } from './pages/contact/contact.component';
import { PanierComponent } from './pages/panier/panier.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProductListComponent } from './admin/product-list/product-list.component';
import { ProductCreateComponent } from './admin/product-create/product-create.component';
import { ProductAdminComponent } from './admin/product-admin/product-admin.component';
import { ProductUpdateComponent } from './admin/product-edit/product-edit.component';
import { ConfirmationComponent } from './pages/confirmation/confirmation.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminDashboard2Component } from './admin/admin-dashboard2/admin-dashboard2.component';
import { ClientDashboardComponent } from './client/client-dashboard/client-dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { OrderTimelineComponent } from './components/order-timeline/order-timeline.component';
import { ProductDetailComponent } from './components/components/product-detail/product-detail.component';
import { CartService } from 'src/services/cart.service';
import { OrderService } from 'src/services/order.service';
import { UserService } from 'src/services/user.service';
import { ApiTestService } from 'src/services/api-test.service';
import { AuthInterceptor } from 'src/services/auth.interceptor';
import { RecoStripComponent } from './components/reco-strip/reco-strip.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    HeroSectionComponent,
    CatalogueComponent,
    CarteProduitComponent,
    AccueilComponent,
    NosCreationsComponent,
    AProposComponent,
    ContactComponent,
    PanierComponent,
    ConfirmationComponent,
    LoginComponent,
    RegisterComponent,
    ProductListComponent,
    ProductCreateComponent,
    ProductAdminComponent,
    ProductUpdateComponent,
    DashboardComponent,
    AdminDashboardComponent,
    AdminDashboard2Component,
    ClientDashboardComponent,
    OrderTimelineComponent,
    ProductDetailComponent,
    RecoStripComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    CommonModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  providers: [
    AuthGuard,
    CartService,
    OrderService,
    UserService,
    ApiTestService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    CurrencyPipe
  ]
  ,
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
