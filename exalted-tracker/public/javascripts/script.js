$( document ).ready(function() {
    console.log( "ready!" );

    // listen for click on input divs
    // create a new row
    // callback
    // resort table
    //
    // ADD NEW COMBATANT
    $("#tracker #input").submit(function() {
        console.log("input submitted");

        var initiative = $("#tracker input.initiative").val();
        var name = $("#tracker input.name").val();

        // verify that init contains an integer:
        if ($.isNumeric(initiative)) {
            console.log(initiative + " is numeric");

            $("#tracker table tbody").append(makeRow(initiative, name));

            // callback here:
            attachTurnMarkerHandler();
            // remove warning from input if necessary
            $("tracker input.initiative").removeClass("alert-danger")

            // if there's no int, apply warning:
        } else {
            $("#tracker input.initiative").addClass("alert-danger").val("Please enter a number");
        }
        return false;
    });
    function makeRow(initiative, name) {
        return "<tr><td><input type=\"checkbox\" class=\"turnMarker\"></td><td>" + initiative + "</td><td>" + name + "</td></tr>"
    }
    // CALLBACKS
    function attachTurnMarkerHandler() {
        $("#tracker .turnMarker").change(function() {
            console.log("changed");
            if (this.checked) {
                $(this).closest("tr").addClass("turnOver");
            } else {
                $(this).closest("tr").removeClass("turnOver");
            }

        });
        $("table").isortope();
    };
    // SORT UPON TABLE CHANGE
    $('#tracker table').isortope();
});
