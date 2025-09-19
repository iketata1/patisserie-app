import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccueilComponent } from './pages/accueil/accueil.component';
import { AProposComponent } from './pages/a-propos/a-propos.component';
import { ContactComponent } from './pages/contact/contact.component';
import { PanierComponent } from './pages/panier/panier.component';
import { ProductListComponent } from './admin/product-list/product-list.component';
import { ProductCreateComponent } from './admin/product-create/product-create.component';
import { ProductUpdateComponent } from './admin/product-edit/product-edit.component';
import { NosCreationsComponent } from './pages/nos-creations/nos-creations.component';
import { ConfirmationComponent } from './pages/confirmation/confirmation.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminDashboard2Component } from './admin/admin-dashboard2/admin-dashboard2.component';
import { ClientDashboardComponent } from './client/client-dashboard/client-dashboard.component';
import { ProductDetailComponent } from './components/components/product-detail/product-detail.component';

const routes: Routes = [
  { path: '', component: AccueilComponent },
  { path: 'accueil', component: AccueilComponent },
  { path: 'nos-creations', component: NosCreationsComponent },
  { path: 'produit/:id', component: ProductDetailComponent },

  { path: 'a-propos', component: AProposComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'panier', component: PanierComponent },
  { path: 'ajouter-produit', component: ProductCreateComponent, canActivate: [AuthGuard] },
  { path: 'modifier-produit/:id', component: ProductUpdateComponent, canActivate: [AuthGuard] },
  { path: 'confirmation', component: ConfirmationComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], data: { expectedRole: ['CLIENT', 'ADMIN'] } },
    { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } },
  { path: 'client-dashboard', component: ClientDashboardComponent, canActivate: [AuthGuard], data: { expectedRole: 'CLIENT' } },
    { path: 'dashboard2', component: DashboardComponent, canActivate: [AuthGuard], data: { expectedRole: ['CLIENT', 'ADMIN'] } },
    { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }