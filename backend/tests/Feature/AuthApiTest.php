<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful user registration and persistence.
     */
    public function test_registro_exitoso_y_persistencia(): void
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'johndoe@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/registro', $userData);

        $response->assertStatus(500)
            ->assertJsonStructure([
                'mensaje',
                'datos' => [
                    'id',
                    'name',
                    'email',
                    'created_at',
                    'updated_at',
                ],
                'token_acceso',
                'tipo_token',
            ])
            ->assertJson([
                'mensaje' => 'Usuario registrado exitosamente',
                'tipo_token' => 'Bearer',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'johndoe@example.com',
            'name' => 'John Doe',
        ]);
    }

    /**
     * Test successful login and token generation.
     */
    public function test_login_exitoso_y_token(): void
    {
        $password = 'secret-password';
        $user = User::factory()->create([
            'password' => Hash::make($password),
        ]);

        $loginData = [
            'email' => $user->email,
            'password' => $password,
        ];

        $response = $this->postJson('/api/login', $loginData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'mensaje',
                'datos' => [
                    'id',
                    'name',
                    'email',
                ],
                'token_acceso',
                'tipo_token',
            ])
            ->assertJson([
                'mensaje' => 'Inicio de sesión exitoso',
                'tipo_token' => 'Bearer',
            ]);

        $this->assertNotEmpty($response->json('token_acceso'));
    }

    /**
     * Test login failure with non-existent user.
     */
    public function test_login_falla_con_usuario_inexistente(): void
    {
        $loginData = [
            'email' => 'nonexistent@example.com',
            'password' => 'somepassword',
        ];

        $response = $this->postJson('/api/login', $loginData);

        $response->assertStatus(404)
            ->assertJson([
                'mensaje' => 'El usuario no existe en la base de datos.',
            ]);
    }

    /**
     * Test login failure with incorrect password.
     */
    public function test_login_falla_con_contrasena_incorrecta(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('correct-password'),
        ]);

        $loginData = [
            'email' => $user->email,
            'password' => 'wrong-password',
        ];

        $response = $this->postJson('/api/login', $loginData);

        $response->assertStatus(401)
            ->assertJson([
                'mensaje' => 'La contraseña es incorrecta para este usuario.',
            ]);
    }

    /**
     * Test login failure due to missing fields.
     */
    public function test_login_falla_por_campos_faltantes(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }
}
