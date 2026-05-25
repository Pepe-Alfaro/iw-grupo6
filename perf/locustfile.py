import os
import random
from typing import Optional

from locust import HttpUser, between, task


BASE_PATH = os.getenv("API_BASE_PATH", "/api/v1")


def _api(path: str) -> str:
    if not path.startswith("/"):
        path = "/" + path
    return f"{BASE_PATH}{path}"


class ReMarketUser(HttpUser):
    """Simulates a real user of the web app hitting the API.

    Focus: login + browsing catalog + opening product detail.
    """

    wait_time = between(0.2, 1.2)

    token: Optional[str] = None
    product_ids: list[int]

    def on_start(self):
        self.product_ids = []
        self._login()
        # Warm up a product list so detail checks can run.
        self._list_products()

    def _login(self):
        email = os.getenv("LOCUST_USER_EMAIL", "jorge@remarket.com")
        password = os.getenv("LOCUST_USER_PASSWORD", "Test1234!")

        with self.client.post(
            _api("/auth/login"),
            json={"email": email, "password": password},
            name="POST /auth/login",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"login failed: {resp.status_code} {resp.text[:200]}")
                self.token = None
                return
            data = resp.json()
            self.token = data.get("access_token")
            if not self.token:
                resp.failure("login response missing access_token")

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def _list_products(self):
        # Keep the payload small to reduce noise.
        params = {"page": 1, "size": 20}
        r = self.client.get(_api("/products"), params=params, name="GET /products")
        if r.status_code == 200:
            try:
                items = r.json().get("items", [])
                self.product_ids = [p["id"] for p in items if "id" in p]
            except Exception:
                # Ignore JSON parsing issues in perf runs; the request stats still matter.
                self.product_ids = []

    @task(2)
    def browse_products(self):
        self._list_products()

    @task(3)
    def open_product_detail(self):
        if not self.product_ids:
            self._list_products()
            if not self.product_ids:
                return
        pid = random.choice(self.product_ids)
        self.client.get(_api(f"/products/{pid}"), name="GET /products/:id")

    @task(1)
    def get_me(self):
        if not self.token:
            self._login()
            if not self.token:
                return
        self.client.get(_api("/users/me"), headers=self._headers(), name="GET /users/me")
