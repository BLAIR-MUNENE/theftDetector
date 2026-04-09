from ninja import Schema


class MessageResponse(Schema):
    status: str = "success"
    message: str
