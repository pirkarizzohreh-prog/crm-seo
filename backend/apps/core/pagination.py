from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """Standard pagination, with an opt-in ?page_size= override (capped) for
    views like the calendar that want a whole month's tasks in one request."""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 500
