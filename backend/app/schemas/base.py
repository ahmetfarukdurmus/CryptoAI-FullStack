import re
from pydantic import BaseModel, ConfigDict


def to_camel(string: str) -> str:
    """snake_case string'i camelCase formata dönüştürür."""
    components = string.split("_")
    return components[0] + "".join(x.capitalize() for x in components[1:])


class CamelModel(BaseModel):
    """
    Tüm Pydantic DTO'ları için temel model.
    JSON serileştirmesinde camelCase (frontend React Native ile %100 uyumlu) çıktı verir,
    ancak hem snake_case hem camelCase girdi kabul eder.
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
