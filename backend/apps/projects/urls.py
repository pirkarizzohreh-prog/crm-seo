from rest_framework.routers import DefaultRouter

from .views import PaymentViewSet, ProjectViewSet

router = DefaultRouter()
router.register("payments", PaymentViewSet, basename="payment")
router.register("", ProjectViewSet, basename="project")

urlpatterns = router.urls
