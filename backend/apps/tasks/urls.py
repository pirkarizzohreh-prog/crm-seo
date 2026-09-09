from rest_framework.routers import DefaultRouter

from .views import TaskCategoryViewSet, TaskTemplateViewSet, TaskViewSet

router = DefaultRouter()
router.register("categories", TaskCategoryViewSet, basename="task-category")
router.register("templates", TaskTemplateViewSet, basename="task-template")
router.register("", TaskViewSet, basename="task")

urlpatterns = router.urls
