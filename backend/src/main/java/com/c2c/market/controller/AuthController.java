package com.c2c.market.controller;

import com.c2c.market.entity.User;
import com.c2c.market.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {
    
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        Optional<User> existing = userRepository.findByUsername(user.getUsername());
        if(existing.isPresent()){
            return ResponseEntity.badRequest().body("El usuario ya existe");
        }
        
        user.setRole("CLIENT"); // Rol por defecto
        // En JWT real, aquí se usa BCryptPasswordEncoder
        User saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginData) {
        Optional<User> userOpt = userRepository.findByUsername(loginData.getUsername());
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Validación directa para el MVP (Sin BCrypt por ahora para simplificar pruebas)
            if(user.getPasswordHash().equals(loginData.getPasswordHash())) {
                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.status(401).body("Credenciales incorrectas");
    }
}
