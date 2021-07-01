let queryInput
let searchResults
let indexingResults
let queryTime
let indexingTime
let queryResultsCount
let spinner
let accordion

const DOCUMENT_NAME_PLACEHOLDER = '{{documentName}}'
const DOCUMENT_CARD_ID_PLACEHOLDER = '{{documentCardId}}'
const SEARCH_RESULT_CHILD_GROUP_ID_PLACE_HOLDER = '{{searchResultChildGroupPlaceholder}}'
const SEARCH_RESULT_CHILD_GROUP_CONTENT_ID_PLACE_HOLDER = '{{searchResultChildGroupPlaceholderContent}}'
const SEARCH_RESULT_TITLE = '{{searchResultTitle}}'
const SEARCH_RESULT_CONTENT_ID = '{{searchResultContentId}}'
const SEARCH_RESULT_CONTENT = '{{searchResultContent}}'

const searchResultDocument = `
<div class="card">
                <div class="card-header" id="{{documentCardId}}">
                    <h5 class="mb-0 d-inline">
                        <button class="btn btn-link" data-toggle="collapse" data-target="#{{searchResultChildGroupPlaceholder}}"
                                aria-expanded="true" aria-controls="{{searchResultChildGroupPlaceholder}}">
                            {{documentName}}
                        </button>
                    </h5>
                </div>
            </div>
            <div id="{{searchResultChildGroupPlaceholder}}" class="collapse" aria-labelledby="{{searchResultChildGroupPlaceholder}}" data-parent="#accordion">
                    <div class="card-body" id="{{searchResultChildGroupPlaceholderContent}}">
                    </div>
                </div>
`
const searchResultChild = `
<div class="card">
                            <div class="card-header">
                                <a href="#" data-toggle="collapse" data-target="#{{searchResultContentId}}">{{searchResultTitle}}</a>
                            </div>
                            <div class="card-body collapse" data-parent="#{{searchResultChildGroupPlaceholderContent}}" id="{{searchResultContentId}}">
                                {{searchResultContent}}
                            </div>
                        </div>
`

function loadSearchResults(data) {
    accordion.empty()
    queryTime.html(data['timeTaken'])
    queryResultsCount.html(data['searchResults'].length)
    let groupedResults = _.groupBy(data['searchResults'], 'title')

    let i = 0
    for (const groupedResultsKey in groupedResults) {
        let textDocumentCollapseId = 'text_file_' + (i + 1)
        let textDocumentResultGrpId = 'text_file_result_grp_' + (i + 1)
        let textDocumentResultGrpContentId = 'text_file_result_grp_content' + (i + 1)
        let textDocumentCollapse = $(searchResultDocument.replaceAll(DOCUMENT_NAME_PLACEHOLDER, groupedResultsKey)
            .replaceAll(DOCUMENT_CARD_ID_PLACEHOLDER, textDocumentCollapseId)
            .replaceAll(SEARCH_RESULT_CHILD_GROUP_ID_PLACE_HOLDER, textDocumentResultGrpId)
            .replaceAll(SEARCH_RESULT_CHILD_GROUP_CONTENT_ID_PLACE_HOLDER, textDocumentResultGrpContentId))
        accordion.append(textDocumentCollapse)
        let j = 0
        const textFileResults = groupedResults[groupedResultsKey]
        let resultGroupEle = $('#' + textDocumentResultGrpContentId)
        for (const groupedResultsKeyIndex in textFileResults) {
            $(searchResultChild.replaceAll(SEARCH_RESULT_TITLE, "line " + textFileResults[groupedResultsKeyIndex]['lineNumber'] + ":")
                .replaceAll(SEARCH_RESULT_CONTENT_ID, 'result_content_' + i + '_' + j)
                .replaceAll(SEARCH_RESULT_CONTENT, textFileResults[groupedResultsKeyIndex]['content'])
                .replaceAll(SEARCH_RESULT_CHILD_GROUP_CONTENT_ID_PLACE_HOLDER, textDocumentResultGrpContentId))
                .appendTo(resultGroupEle)
            ++j
        }
        ++i
    }
}

function searchQuery() {
    spinner.show()
    searchResults.hide()
    indexingResults.hide()
    let payLoad = {
        'type': 'search',
        'queryString': queryInput.val()
    }
    $.ajax({
        type: 'POST',
        url: "/",
        contentType: "application/json",
        dataType: 'json',
        data: JSON.stringify(payLoad)
    }).done(function (data) {
        loadSearchResults(data)
        spinner.hide()
        searchResults.show()
        indexingResults.show()
    });
}

function indexData() {
    spinner.show()
    searchResults.hide()
    indexingResults.hide()
    let payLoad = {
        'type': 'indexing'
    }
    $.ajax({
        type: 'POST',
        url: "/",
        contentType: "application/json",
        dataType: 'json',
        data: JSON.stringify(payLoad)
    }).done(function (data) {
        console.log(data);
        indexingTime.html("Time taken for indexing: " + data['timeTaken'])
        spinner.hide()
        indexingResults.show()
    });
}

$(function () {
    queryInput = $('#query_string')
    searchResults = $('#search_results')
    indexingResults = $('#indexing_results')
    queryTime = $('#query_time')
    indexingTime = $('#indexing_time')
    queryResultsCount = $('#query_results_count')
    spinner = $('#spinner')
    accordion = $('#accordion')
    spinner.hide()
    searchResults.hide()
    indexingResults.hide()
    $(document).on('keypress', function (e) {
        if (e.which === 13) {
            searchQuery()
        }
    });
})