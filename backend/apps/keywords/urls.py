from rest_framework.routers import DefaultRouter

from .views import ContentBriefViewSet, KeywordViewSet

router = DefaultRouter()
router.register("content-briefs", ContentBriefViewSet, basename="content-brief")
router.register("", KeywordViewSet, basename="keyword")

urlpatterns = router.urls
