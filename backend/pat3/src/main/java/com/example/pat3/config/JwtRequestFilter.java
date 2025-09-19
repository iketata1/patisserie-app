package com.example.pat3.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    @Lazy
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String uri = request.getRequestURI();

        // Ignorer les routes publiques (pas de JWT nécessaire)
        if (uri.startsWith("/api/users/register") || uri.startsWith("/api/users/login")
                || uri.startsWith("/uploads") || uri.startsWith("/inesk/uploads")
                || uri.startsWith("/css") || uri.startsWith("/js") || uri.startsWith("/images")) {
            chain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");

        // ⬇️ AJOUT ICI : log présence du header Authorization
        if (logger.isDebugEnabled()) {
            logger.debug("[JWT] {} {} -> Authorization header: {}"
            );
        }

        String username = null;
        String jwt = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.warn("JWT invalide: " + e.getMessage());
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
            if (jwtUtil.validateToken(jwt, userDetails)) {
                var authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            System.out.println("[SECURITY] user=" + auth.getName() + " authorities=" + auth.getAuthorities());
        } else {
            System.out.println("[SECURITY] pas d'authentication dans le contexte");
        }

        chain.doFilter(request, response);
    }
}