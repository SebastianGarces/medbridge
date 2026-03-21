import pytest
from unittest.mock import AsyncMock, MagicMock

from ai_health_coach.safety.classifier import keyword_check, llm_classify, classify_message
from ai_health_coach.safety.fallback import SAFE_FALLBACK_MESSAGE


def test_keyword_blocks_diagnosis():
    assert keyword_check("Your diagnosis suggests...") is True


def test_keyword_blocks_medication():
    assert keyword_check("Take this medication daily") is True


def test_keyword_blocks_dosage_pattern():
    assert keyword_check("You should increase your dose") is True


def test_keyword_case_insensitive():
    assert keyword_check("PRESCRIPTION needed") is True


def test_keyword_allows_safe_message():
    assert keyword_check("Great job on your exercises!") is False


def test_keyword_allows_motivation():
    assert keyword_check("Keep up the great work with your stretches") is False


@pytest.mark.asyncio
async def test_llm_classifier_safe():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=MagicMock(content="SAFE"))
    result = await llm_classify("Great job today!", mock_llm)
    assert result.is_safe is True


@pytest.mark.asyncio
async def test_llm_classifier_clinical():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=MagicMock(content="CLINICAL"))
    result = await llm_classify("You should take ibuprofen", mock_llm)
    assert result.is_safe is False
    assert result.category == "CLINICAL"


@pytest.mark.asyncio
async def test_llm_classifier_crisis():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=MagicMock(content="CRISIS"))
    result = await llm_classify("I want to end it all", mock_llm)
    assert result.is_safe is False
    assert result.category == "CRISIS"


@pytest.mark.asyncio
async def test_classify_message_keyword_short_circuits():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock()
    result = await classify_message("Take this medication", mock_llm)
    assert result.is_safe is False
    mock_llm.ainvoke.assert_not_called()


def test_fallback_message_is_safe():
    assert keyword_check(SAFE_FALLBACK_MESSAGE) is False
